<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\OrganizePdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class OrganizePdfController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'pages_to_remove' => 'required|string', // e.g. "2,4"
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        $pagesToRemove = array_map('intval', explode(',', $request->input('pages_to_remove')));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'organize_pdf',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'filename' => 'organized-' . time() . '.pdf',
                'pages_to_remove' => $pagesToRemove,
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        OrganizePdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.organize-pdf.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.organize-pdf.download', $jobId) : null,
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

        $filename = $toolJob->metadata['filename'] ?? 'organized.pdf';

        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
