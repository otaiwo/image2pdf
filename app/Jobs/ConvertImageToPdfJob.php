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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ConvertImageToPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum number of attempts.
     */
    public int $tries = 3;

    /**
     * Timeout in seconds.
     */
    public int $timeout = 300;

    /**
     * Retry delays.
     */
    public array $backoff = [10, 30, 60];

    protected string $jobId;

    protected array $options;

    /**
     * Create a new job instance.
     */
    public function __construct(string $jobId, array|string $options = [])
    {
        $this->jobId = $jobId;

        $this->options = is_string($options)
            ? json_decode($options, true) ?? []
            : $options;
    }

    /**
     * Execute the job.
     */
    public function handle(
        ImageToPdfService $pdfService,
        TempFileService $tempFileService
    ): void {
        $toolJob = ToolJob::where('job_id', $this->jobId)->first();

        if (! $toolJob) {
            Log::warning("ConvertImageToPdfJob: ToolJob not found for job ID {$this->jobId}");
            return;
        }

        try {
            $toolJob->update([
                'status' => 'processing',
            ]);

            $pdfContent = $pdfService->convertImagesToPdf(
                $toolJob->input_files,
                $this->options
            );

            $pdfPath = $tempFileService->storePdf(
                $pdfContent,
                $this->jobId
            );

            DB::transaction(function () use ($toolJob, $pdfPath) {
                $toolJob->update([
                    'output_file'  => $pdfPath,
                    'status'       => 'completed',
                    'completed_at' => now(),
                ]);
            });

            Log::info(
                "PDF conversion completed successfully for job {$this->jobId}"
            );
        } catch (Throwable $e) {
            Log::error(
                "PDF conversion failed for job {$this->jobId}",
                [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]
            );

            try {
                $tempFileService->deleteDirectory(
                    "images/{$this->jobId}"
                );
            } catch (Throwable $cleanupException) {
                Log::warning(
                    "Cleanup failed for job {$this->jobId}",
                    [
                        'error' => $cleanupException->getMessage(),
                    ]
                );
            }

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(Throwable $exception): void
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->first();

        if (! $toolJob) {
            return;
        }

        $metadata = is_array($toolJob->metadata)
            ? $toolJob->metadata
            : [];

        // Sanitize error message: never expose full exception details to users
        // Log the full error server-side, but return a generic message to the user
        Log::error(
            "ConvertImageToPdfJob permanently failed",
            [
                'job_id' => $this->jobId,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]
        );

        $metadata['error'] = 'An unexpected error occurred during conversion. Please try again.';
        $metadata['failed_at'] = now()->toDateTimeString();

        $toolJob->update([
            'status' => 'failed',
            'metadata' => $metadata,
        ]);
    }
}
