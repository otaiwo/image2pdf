<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\SignPdfService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SignPdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(SignPdfService $service)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            // input_files[0] = PDF, input_files[1] = Signature
            $sigContent = Storage::disk('temp')->get($toolJob->input_files[1]);
            $sigTemp = tempnam(sys_get_temp_dir(), 'sig');
            file_put_contents($sigTemp, $sigContent);

            $content = $service->sign($toolJob->input_files[0], $sigTemp, [
                'x' => $toolJob->metadata['x'],
                'y' => $toolJob->metadata['y'],
                'width' => $toolJob->metadata['width'],
                'page' => $toolJob->metadata['page'],
            ]);

            unlink($sigTemp);

            $outputPath = "outputs/{$this->jobId}/" . Str::random(40) . ".pdf";
            Storage::disk('temp')->put($outputPath, $content);

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
