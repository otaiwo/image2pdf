<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\ImageToPdfService;
use App\Services\Storage\TempFileService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ConvertImageToPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $options;

    public function __construct($jobId, $options = [])
    {
        $this->jobId = $jobId;
        $this->options = $options;
        $this->onQueue('pdf_conversion');
    }

    public function handle(ImageToPdfService $pdfService, TempFileService $tempFileService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            // Convert images to PDF
            $pdfContent = $pdfService->convertImagesToPdf(
                $toolJob->input_files,
                $this->options
            );

            // Store PDF
            $pdfPath = $tempFileService->storePdf($pdfContent, $this->jobId);

            // Update job record
            $toolJob->update([
                'output_file' => $pdfPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("PDF conversion completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("PDF conversion failed for job {$this->jobId}: " . $e->getMessage());

            // Cleanup on failure
            $tempFileService->deleteDirectory("images/{$this->jobId}");

            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->first();
        if ($toolJob) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $exception->getMessage(),
                ]),
            ]);
        }
    }
}
