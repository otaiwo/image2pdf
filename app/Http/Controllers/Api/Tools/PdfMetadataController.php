<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\EditMetadataPdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfMetadataController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480', // 20MB
            'title' => 'nullable|string|max:255',
            'author' => 'nullable|string|max:255',
            'subject' => 'nullable|string|max:255',
            'keywords' => 'nullable|string|max:255',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'edit_metadata',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'original_filename' => $file->getClientOriginalName(),
                'requested_metadata' => [
                    'title' => $request->input('title'),
                    'author' => $request->input('author'),
                    'subject' => $request->input('subject'),
                    'keywords' => $request->input('keywords'),
                ],
            ],
        ]);

        EditMetadataPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.edit-metadata.status', $jobId),
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
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'is_completed' => $toolJob->status === 'completed',
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.edit-metadata.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed' || !$toolJob->output_file) {
            return response()->json(['success' => false, 'message' => 'File not ready'], 404);
        }

        $originalFilename = $toolJob->metadata['original_filename'] ?? 'document.pdf';
        return Storage::disk('temp')->download($toolJob->output_file, $originalFilename);
    }
}
