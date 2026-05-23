<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\FileConversionService;
use App\Services\Storage\TempFileService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FileConverterJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $type;
    protected $options;

    public function __construct(string $jobId, string $type, array $options = [])
    {
        $this->jobId = $jobId;
        $this->type = $type;
        $this->options = $options;
    }

    public function handle(FileConversionService $conversionService, TempFileService $tempFileService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $inputFile = $toolJob->input_files[0]; // Assuming single file for these conversions
            $extension = pathinfo($inputFile, PATHINFO_EXTENSION);

            $outputContent = null;
            $outputExtension = 'pdf';

            switch ($this->type) {
                case 'file_to_pdf':
                    $outputContent = $conversionService->convertToPdf($inputFile, $extension);
                    $outputExtension = 'pdf';
                    break;
                case 'pdf_to_txt':
                    $outputContent = $conversionService->convertPdfToText($inputFile);
                    $outputExtension = 'txt';
                    break;
                case 'pdf_to_docx':
                    $outputContent = $conversionService->convertPdfToDocx($inputFile);
                    $outputExtension = 'docx';
                    break;
                default:
                    throw new \Exception("Unsupported conversion type: {$this->type}");
            }

            // Store Output
            $filename = \Illuminate\Support\Str::random(40) . '.' . $outputExtension;
            $outputPath = "outputs/{$this->jobId}/{$filename}";
            \Illuminate\Support\Facades\Storage::disk('temp')->put($outputPath, $outputContent);

            // Update job record
            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("File conversion {$this->type} completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("File conversion {$this->type} failed for job {$this->jobId}: " . $e->getMessage());

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
