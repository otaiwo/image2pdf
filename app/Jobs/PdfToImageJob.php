<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\PdfToImageService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class PdfToImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(PdfToImageService $service)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $format = $toolJob->metadata['format'] ?? 'jpg';
            $images = $service->convertPdfToImages($toolJob->input_files[0], $format);

            if (empty($images)) {
                throw new \Exception("No images were generated.");
            }

            // Create a ZIP if multiple images, or just save the single image
            // For now, let's always zip for consistency
            $zip = new ZipArchive();
            $zipPath = storage_path('app/temp/' . Str::random(40) . '.zip');

            if ($zip->open($zipPath, ZipArchive::CREATE) === TRUE) {
                foreach ($images as $index => $content) {
                    $zip->addFromString("page_" . ($index + 1) . "." . $format, $content);
                }
                $zip->close();
            }

            $outputPath = "outputs/{$this->jobId}/images.zip";
            Storage::disk('temp')->put($outputPath, file_get_contents($zipPath));
            unlink($zipPath);

            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata, ['error' => $e->getMessage()]),
            ]);
        }
    }
}
