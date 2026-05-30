<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\PdfSecurityService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProtectPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(PdfSecurityService $securityService)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $password = $toolJob->metadata['password'] ?? '';
            if (empty($password)) {
                throw new \Exception("Password is required for protection.");
            }

            $options = [
                'allow_printing' => $toolJob->metadata['allow_printing'] ?? true,
                'allow_copying' => $toolJob->metadata['allow_copying'] ?? true,
                'allow_editing' => $toolJob->metadata['allow_editing'] ?? true,
                'allow_annotating' => $toolJob->metadata['allow_annotating'] ?? true,
                'allow_extracting' => $toolJob->metadata['allow_extracting'] ?? true,
                'owner_password' => $toolJob->metadata['owner_password'] ?? null,
                'scrub_metadata' => $toolJob->metadata['scrub_metadata'] ?? false,
                'watermark_text' => $toolJob->metadata['watermark_text'] ?? null,
            ];

            $processedFiles = [];
            foreach ($toolJob->input_files as $index => $inputFile) {
                $protectedContent = $securityService->protect($inputFile, $password, $options);

                $originalName = $toolJob->metadata['original_filenames'][$index] ?? "file-{$index}.pdf";
                $safeName = "protected-" . pathinfo($originalName, PATHINFO_FILENAME) . ".pdf";

                $tempPath = "outputs/{$this->jobId}/parts/{$safeName}";
                Storage::disk('temp')->put($tempPath, $protectedContent);
                $processedFiles[] = $tempPath;
            }

            if (count($processedFiles) > 1) {
                // Zip multiple files
                $zip = new \ZipArchive();
                $zipFileName = Str::random(40) . '.zip';
                $zipPath = storage_path("app/temp/outputs/{$this->jobId}/{$zipFileName}");

                if (!file_exists(dirname($zipPath))) {
                    mkdir(dirname($zipPath), 0755, true);
                }

                if ($zip->open($zipPath, \ZipArchive::CREATE) === TRUE) {
                    foreach ($processedFiles as $file) {
                        $fullPath = Storage::disk('temp')->path($file);
                        $zip->addFile($fullPath, basename($file));
                    }
                    $zip->close();
                }

                $outputPath = "outputs/{$this->jobId}/{$zipFileName}";
            } else {
                // Single file
                $filename = Str::random(40) . '.pdf';
                $outputPath = "outputs/{$this->jobId}/{$filename}";
                Storage::disk('temp')->put($outputPath, Storage::disk('temp')->get($processedFiles[0]));
            }

            $toolJob->update([
                'output_file' => $outputPath,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            Log::info("Protect PDF completed for job {$this->jobId}");
        } catch (\Exception $e) {
            $toolJob->update([
                'status' => 'failed',
                'metadata' => array_merge($toolJob->metadata ?? [], [
                    'error' => $e->getMessage(),
                ]),
            ]);

            Log::error("Protect PDF failed for job {$this->jobId}: " . $e->getMessage());
            throw $e;
        }
    }
}
