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

class TranslatePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $targetLanguage;

    public function __construct(string $jobId, string $targetLanguage)
    {
        $this->jobId = $jobId;
        $this->targetLanguage = $targetLanguage;
    }

    public function handle(PdfAiService $aiService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $translation = $aiService->translate($toolJob->input_files[0], $this->targetLanguage);

            $toolJob->update([
                'status' => 'completed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'translation' => $translation,
                    'target_language' => $this->targetLanguage,
                ]),
                'completed_at' => now(),
            ]);

            Log::info("AI Translation completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("AI Translation failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
