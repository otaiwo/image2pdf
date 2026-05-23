<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\AI\PdfAiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SummarizePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(PdfAiService $aiService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $summary = $aiService->summarize($toolJob->input_files[0]);

            $toolJob->update([
                'status' => 'completed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'summary' => $summary,
                ]),
                'completed_at' => now(),
            ]);

            Log::info("AI Summary completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("AI Summary failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
