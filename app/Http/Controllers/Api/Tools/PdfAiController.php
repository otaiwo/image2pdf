<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\SummarizePdfJob;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PdfAiController extends Controller
{
    public function summarize(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240', // 10MB
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'ai_summarize',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        \App\Jobs\SummarizePdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.ai.status', $jobId),
        ], 202);
    }

    public function extractKeywords(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'ai_keywords',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        \App\Jobs\ExtractKeywordsPdfJob::dispatch($jobId);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.ai.status', $jobId),
        ], 202);
    }

    public function translate(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
            'language' => 'required|string|max:50',
        ]);

        $jobId = Str::uuid()->toString();
        $file = $request->file('file');

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'ai_translate',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'original_filename' => $file->getClientOriginalName(),
                'target_language' => $request->input('language'),
            ],
        ]);

        \App\Jobs\TranslatePdfJob::dispatch($jobId, $request->input('language'));

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.ai.status', $jobId),
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
                'type' => $toolJob->type,
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'is_completed' => $toolJob->status === 'completed',
                'summary' => $toolJob->metadata['summary'] ?? null,
                'keywords' => $toolJob->metadata['keywords'] ?? null,
                'translation' => $toolJob->metadata['translation'] ?? null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }
}
