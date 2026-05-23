<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Services\AI\PdfChatService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser;

class PdfChatController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $file = $request->file('file');
        $jobId = Str::uuid()->toString();

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        // Extract text immediately for chat readiness
        $parser = new Parser();
        $pdf = $parser->parseFile($file->getRealPath());
        $text = $pdf->getText();

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'pdf_chat',
            'status' => 'completed', // Chat is ready once text is extracted
            'input_files' => [$path],
            'metadata' => [
                'extracted_text' => $text,
                'original_filename' => $file->getClientOriginalName(),
            ],
        ]);

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'message' => 'PDF analyzed and ready for chat.',
        ]);
    }

    public function ask(Request $request, string $jobId, PdfChatService $chatService): JsonResponse
    {
        $request->validate([
            'question' => 'required|string|max:1000',
            'history' => 'array',
        ]);

        $job = ToolJob::where('job_id', $jobId)->where('type', 'pdf_chat')->firstOrFail();
        $text = $job->metadata['extracted_text'] ?? '';

        $answer = $chatService->ask($text, $request->question, $request->input('history', []));

        return response()->json([
            'success' => true,
            'answer' => $answer,
        ]);
    }
}
