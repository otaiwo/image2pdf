<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\UnlockPdfService;
use App\Services\Pdf\WatermarkPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UnlockPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(UnlockPdfService $unlockService, WatermarkPdfService $wmService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $password = $toolJob->metadata['password'] ?? '';

            $unlockedContent = $unlockService->unlock($toolJob->input_files[0], $password);

            // Apply guest watermark if applicable
            if (!$toolJob->user_id) {
                $tempPath = tempnam(sys_get_temp_dir(), 'wm_guest_unlock');
                file_put_contents($tempPath, $unlockedContent);
                $unlockedContent = $wmService->addTextWatermark(
                    $tempPath,
                    'Made with PDFMaster AI',
                    ['font_size' => 30, 'position' => 'bottom_right']
                );
                unlink($tempPath);
            }

            $filename = Str::random(40) . '.pdf';
            $outputPath = "outputs/{$this->jobId}/{$filename}";

            Storage::disk('temp')->put($outputPath, $unlockedContent);

            // Scrub sensitive metadata before saving
            $metadata = $toolJob->metadata;
            unset($metadata['password']);

            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
                'metadata' => $metadata,
            ]);

            Log::info("Unlock PDF completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("Unlock PDF failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
