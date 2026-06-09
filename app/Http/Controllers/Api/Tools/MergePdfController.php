<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Traits\AuthorizesToolJobs;
use App\Jobs\MergePdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MergePdfController extends Controller
{
    use AuthorizesToolJobs;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:2',
            'files.*' => 'required|file|mimes:pdf|max:20480', // 20MB per file
        ]);

        $jobId = Str::uuid()->toString();
        $uploadedPaths = [];

        foreach ($request->file('files') as $file) {
            $this->assertPdfSignature($file);

            $filename = Str::random(40) . '.pdf';
            $path = "uploads/{$jobId}/{$filename}";
            $file->storeAs("uploads/{$jobId}", $filename, ['disk' => 'temp']);
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
        $toolJob = $this->findAuthorizedToolJob($jobId, 'merge_pdf');

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'is_completed' => $toolJob->status === 'completed',
                'is_expired' => $toolJob->created_at->lt(now()->subHour()),
                'filename' => $toolJob->metadata['filename'] ?? 'merged.pdf',
                'created_at' => $toolJob->created_at->toIso8601String(),
                'updated_at' => $toolJob->updated_at->toIso8601String(),
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.merge-pdf.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = $this->findAuthorizedToolJob($jobId, 'merge_pdf');

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'PDF not ready'], 404);
        }

        $filename = $toolJob->metadata['filename'] ?? 'merged.pdf';

        return $this->downloadTempFile($toolJob->output_file, $filename);
    }

    private function assertPdfSignature(\Illuminate\Http\UploadedFile $file): void
    {
        $handle = fopen($file->getRealPath(), 'rb');
        $signature = $handle ? fread($handle, 4) : false;

        if (is_resource($handle)) {
            fclose($handle);
        }

        if ($signature !== '%PDF') {
            throw ValidationException::withMessages([
                'files' => ['Each uploaded file must be a valid PDF document.'],
            ]);
        }
    }
}
