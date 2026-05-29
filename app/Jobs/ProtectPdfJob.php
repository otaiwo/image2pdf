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
            ];

            $protectedContent = $securityService->protect($toolJob->input_files[0], $password, $options);

            $filename = Str::random(40) . '.pdf';
            $outputPath = "outputs/{$this->jobId}/{$filename}";

            Storage::disk('temp')->put($outputPath, $protectedContent);

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
