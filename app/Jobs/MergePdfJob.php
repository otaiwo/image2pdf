<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\MergePdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MergePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(MergePdfService $mergeService, WatermarkPdfService $wmService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $mergedContent = $mergeService->merge($toolJob->input_files);

            // Apply guest watermark if applicable
            if (!$toolJob->user_id) {
                $tempPath = tempnam(sys_get_temp_dir(), 'wm_guest');
                file_put_contents($tempPath, $mergedContent);
                $mergedContent = $wmService->addTextWatermark($tempPath, 'Made with PDFMaster AI', ['font_size' => 30]);
                unlink($tempPath);
            }

            $filename = Str::random(40) . '.pdf';
            $outputPath = "outputs/{$this->jobId}/{$filename}";

            Storage::disk('temp')->put($outputPath, $mergedContent);

            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("Merge PDF completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("Merge PDF failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
