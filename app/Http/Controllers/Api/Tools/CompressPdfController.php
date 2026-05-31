<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Jobs\CompressPdfJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CompressPdfController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'level' => 'required|string|in:low,medium,high',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');
        $level = $request->input('level');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'compress_pdf',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'level' => $level,
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        CompressPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.compress-pdf.status', $jobId),
            ]
        ], 202);
    }

    public function status(string $jobId): JsonResponse
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();
        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'is_completed' => $toolJob->status === 'completed',
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.compress-pdf.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();
        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false], 404);
        }

        $filename = 'compressed-' . ($toolJob->metadata['original_filename'] ?? 'document.pdf');
        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
