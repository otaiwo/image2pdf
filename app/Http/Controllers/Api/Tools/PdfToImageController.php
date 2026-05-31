<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Jobs\PdfToImageJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfToImageController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'format' => 'required|string|in:jpg,png',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');
        $format = $request->input('format');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'pdf_to_image',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'format' => $format,
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        PdfToImageJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.pdf-to-image.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.pdf-to-image.download', $jobId) : null,
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

        $filename = ($toolJob->metadata['format'] ?? 'image') . '.zip';
        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
