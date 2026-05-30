<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\ProtectPdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProtectPdfController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:pdf|max:20480',
            'password' => 'required|string|min:4|max:50',
            'owner_password' => 'sometimes|nullable|string|min:4|max:50',
            'allow_printing' => 'sometimes|boolean',
            'allow_copying' => 'sometimes|boolean',
            'allow_editing' => 'sometimes|boolean',
            'allow_annotating' => 'sometimes|boolean',
            'allow_extracting' => 'sometimes|boolean',
            'scrub_metadata' => 'sometimes|boolean',
            'watermark_text' => 'sometimes|nullable|string|max:100',
        ]);

        $jobId = Str::uuid()->toString();
        $uploadedPaths = [];
        $originalFilenames = [];

        foreach ($request->file('files') as $file) {
            $filename = Str::random(40) . '.pdf';
            $path = "uploads/{$jobId}/{$filename}";
            Storage::disk('temp')->put($path, file_get_contents($file));
            $uploadedPaths[] = $path;
            $originalFilenames[] = $file->getClientOriginalName();
        }

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'protect_pdf',
            'status' => 'pending',
            'input_files' => $uploadedPaths,
            'metadata' => [
                'filename' => count($uploadedPaths) > 1 ? 'protected-' . time() . '.zip' : 'protected-' . time() . '.pdf',
                'password' => $request->input('password'),
                'owner_password' => $request->input('owner_password'),
                'original_filenames' => $originalFilenames,
                'allow_printing' => $request->boolean('allow_printing', true),
                'allow_copying' => $request->boolean('allow_copying', true),
                'allow_editing' => $request->boolean('allow_editing', true),
                'allow_annotating' => $request->boolean('allow_annotating', true),
                'allow_extracting' => $request->boolean('allow_extracting', true),
                'scrub_metadata' => $request->boolean('scrub_metadata', false),
                'watermark_text' => $request->input('watermark_text'),
            ],
        ]);

        ProtectPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.protect-pdf.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.protect-pdf.download', $jobId) : null,
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

        $filename = $toolJob->metadata['filename'] ?? 'protected.pdf';

        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
