<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Traits\AuthorizesToolJobs;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class WebToPdfController extends Controller
{
    use AuthorizesToolJobs;

    /**
     * Convert URL to PDF
     */
    public function convertUrl(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url',
            'options' => 'nullable|array',
        ]);

        $jobId = Str::uuid()->toString();
        $url = $request->input('url');
        $options = $request->input('options', []);

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => Auth::id(),
            'type' => 'web_to_pdf',
            'status' => 'pending',
            'input_files' => [$url],
            'metadata' => [
                'source' => 'url',
                'url' => $url,
                'options' => $options,
            ],
        ]);

        // TODO: Dispatch job
        // WebToPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.web-to-pdf.status', $jobId),
            ]
        ], 202);
    }

    /**
     * Convert HTML to PDF
     */
    public function convertHtml(Request $request): JsonResponse
    {
        $request->validate([
            'html' => 'required|string',
            'options' => 'nullable|array',
        ]);

        $jobId = Str::uuid()->toString();
        $html = $request->input('html');
        $options = $request->input('options', []);

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => Auth::id(),
            'type' => 'web_to_pdf',
            'status' => 'pending',
            'input_files' => [],
            'metadata' => [
                'source' => 'html',
                'html' => $html,
                'options' => $options,
            ],
        ]);

        // TODO: Dispatch job
        // WebToPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.web-to-pdf.status', $jobId),
            ]
        ], 202);
    }

    /**
     * Convert Markdown to PDF
     */
    public function convertMarkdown(Request $request): JsonResponse
    {
        $request->validate([
            'markdown' => 'required|string',
            'options' => 'nullable|array',
        ]);

        $jobId = Str::uuid()->toString();
        $markdown = $request->input('markdown');
        $options = $request->input('options', []);

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => Auth::id(),
            'type' => 'web_to_pdf',
            'status' => 'pending',
            'input_files' => [],
            'metadata' => [
                'source' => 'markdown',
                'markdown' => $markdown,
                'options' => $options,
            ],
        ]);

        // TODO: Dispatch job
        // WebToPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.web-to-pdf.status', $jobId),
            ]
        ], 202);
    }

    /**
     * Get job status
     */
    public function status(string $jobId): JsonResponse
    {
        $toolJob = $this->findAuthorizedToolJob($jobId, 'web_to_pdf');

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'created_at' => $toolJob->created_at->toIso8601String(),
                'is_completed' => $toolJob->status === 'completed',
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.web-to-pdf.download', $jobId) : null,
            ],
        ]);
    }

    /**
     * Download converted PDF
     */
    public function download(string $jobId): Response|JsonResponse
    {
        $toolJob = $this->findAuthorizedToolJob($jobId, 'web_to_pdf');

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'PDF not ready'], 404);
        }

        $filename = 'converted-' . Str::random(8) . '.pdf';

        return $this->downloadTempFile($toolJob->output_file, $filename);
    }
}
