<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Traits\AuthorizesToolJobs;
use App\Models\ToolJob;
use App\Jobs\SignPdfJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SignPdfController extends Controller
{
    use AuthorizesToolJobs;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'signature' => 'required|file|mimes:png,jpg,jpeg|max:2048',
            'x' => 'nullable|numeric',
            'y' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'page' => 'nullable|integer',
        ]);

        $jobId = Str::uuid()->toString();
        
        $path = "uploads/{$jobId}/" . Str::random(40) . ".pdf";
        Storage::disk('temp')->put($path, file_get_contents($request->file('file')));

        $sigPath = "uploads/{$jobId}/" . Str::random(40) . "." . $request->file('signature')->getClientOriginalExtension();
        Storage::disk('temp')->put($sigPath, file_get_contents($request->file('signature')));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'sign_pdf',
            'status' => 'pending',
            'input_files' => [$path, $sigPath],
            'metadata' => [
                'x' => $request->input('x', 150),
                'y' => $request->input('y', 250),
                'width' => $request->input('width', 40),
                'page' => $request->input('page', 1),
                'original_filename' => $request->file('file')->getClientOriginalName(),
            ],
        ]);

        SignPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.sign-pdf.status', $jobId),
            ]
        ], 202);
    }

    public function status(string $jobId): JsonResponse
    {
        $toolJob = $this->findAuthorizedToolJob($jobId, 'sign_pdf');
        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'is_completed' => $toolJob->status === 'completed',
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.sign-pdf.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = $this->findAuthorizedToolJob($jobId, 'sign_pdf');
        if ($toolJob->status !== 'completed') return response()->json(['success' => false], 404);

        return $this->downloadTempFile($toolJob->output_file, 'signed-' . $toolJob->metadata['original_filename']);
    }
}
