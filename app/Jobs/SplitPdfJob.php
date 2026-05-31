<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\SplitPdfService;
use App\Services\Pdf\WatermarkPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SplitPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(SplitPdfService $splitService, WatermarkPdfService $wmService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $pages = $toolJob->metadata['pages'] ?? [];
            if (empty($pages)) {
                throw new \Exception("No pages specified for splitting.");
            }

            $splitContent = $splitService->split($toolJob->input_files[0], $pages);

            // Apply guest watermark if applicable
            if (!$toolJob->user_id) {
                $splitContent = $wmService->addTextWatermarkFromContent(
                    $splitContent,
                    'Made with PDFMaster AI',
                    ['font_size' => 30, 'position' => 'bottom_right']
                );
            }

            $filename = Str::random(40) . '.pdf';
            $outputPath = "outputs/{$this->jobId}/{$filename}";

            Storage::disk('temp')->put($outputPath, $splitContent);

            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("Split PDF completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("Split PDF failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
