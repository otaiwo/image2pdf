<?php

namespace App\Jobs;

use App\Models\ToolJob;
use App\Services\Pdf\PageNumberService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AddPageNumbersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;

    public function __construct(string $jobId)
    {
        $this->jobId = $jobId;
    }

    public function handle(PageNumberService $service)
    {
        $toolJob = ToolJob::where('job_id', $this->jobId)->firstOrFail();

        try {
            $toolJob->update(['status' => 'processing']);

            $content = $service->addPageNumbers($toolJob->input_files[0], [
                'position' => $toolJob->metadata['position'] ?? 'bottom_center',
                'start_at' => $toolJob->metadata['start_at'] ?? 1,
            ]);

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
