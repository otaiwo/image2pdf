<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\MergePdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MergePdfController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:2',
            'files.*' => 'required|file|mimes:pdf|max:20480', // 20MB per file
        ]);

        $jobId = Str::uuid()->toString();
        $uploadedPaths = [];

        foreach ($request->file('files') as $file) {
            $filename = Str::random(40) . '.pdf';
            $path = "uploads/{$jobId}/{$filename}";
            Storage::disk('temp')->put($path, file_get_contents($file));
            $uploadedPaths[] = $path;
        }

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'merge_pdf',
            'status' => 'pending',
            'input_files' => $uploadedPaths,
            'metadata' => [
                'filename' => 'merged-' . time() . '.pdf',
                'original_filenames' => array_map(fn($f) => $f->getClientOriginalName(), $request->file('files')),
            ],
        ]);

        MergePdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.merge-pdf.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.merge-pdf.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'PDF not ready'], 404);
        }

        $filename = $toolJob->metadata['filename'] ?? 'merged.pdf';

        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
