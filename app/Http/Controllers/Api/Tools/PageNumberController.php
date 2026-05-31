<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Jobs\AddPageNumbersJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PageNumberController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'position' => 'required|string',
            'start_at' => 'nullable|integer',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $path = "uploads/{$jobId}/" . Str::random(40) . ".pdf";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'add_page_numbers',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'position' => $request->input('position'),
                'start_at' => $request->input('start_at', 1),
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        AddPageNumbersJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.add-page-numbers.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.add-page-numbers.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();
        if ($toolJob->status !== 'completed') return response()->json(['success' => false], 404);
        return Storage::disk('temp')->download($toolJob->output_file, 'numbered-' . $toolJob->metadata['original_filename']);
    }
}
