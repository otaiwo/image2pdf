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

class ExtractKeywordsPdfJob implements ShouldQueue
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

            $keywords = $aiService->extractKeywords($toolJob->input_files[0]);

            $toolJob->update([
                'status' => 'completed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'keywords' => $keywords,
                ]),
                'completed_at' => now(),
            ]);

            Log::info("AI Keywords completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("AI Keywords failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
