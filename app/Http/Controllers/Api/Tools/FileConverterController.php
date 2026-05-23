<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Jobs\FileConverterJob;
use App\Models\ToolJob;
use App\Services\Storage\TempFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileConverterController extends Controller
{
    protected $tempFileService;

    public function __construct(TempFileService $tempFileService)
    {
        $this->tempFileService = $tempFileService;
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|max:20480', // 20MB
            'type' => 'required|string|in:file_to_pdf,pdf_to_txt,pdf_to_docx',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        $type = $request->input('type');

        // Validation based on type
        if ($type === 'file_to_pdf') {
            if (!in_array($extension, ['txt', 'docx', 'pptx'])) {
                return response()->json(['success' => false, 'message' => 'Unsupported file extension for PDF conversion. Supported: TXT, DOCX, PPTX'], 422);
            }
        } elseif ($type === 'pdf_to_txt' || $type === 'pdf_to_docx') {
            if ($extension !== 'pdf') {
                return response()->json(['success' => false, 'message' => 'Input must be a PDF file.'], 422);
            }
        }

        $jobId = Str::uuid()->toString();

        $filename = Str::random(40) . '.' . $extension;
        $path = "uploads/{$jobId}/{$filename}";

        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('temp')->put($path, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => $request->type,
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'original_filename' => $file->getClientOriginalName(),
                'options' => $request->input('options', []),
            ],
        ]);

        FileConverterJob::dispatch($jobId, $request->type, $request->input('options', []));

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.file-converter.status', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.file-converter.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'File not ready'], 404);
        }

        if (!Storage::disk('temp')->exists($toolJob->output_file)) {
            return response()->json(['success' => false, 'message' => 'File not found on disk'], 404);
        }

        $originalFilename = $toolJob->metadata['original_filename'] ?? 'converted';
        $extension = pathinfo($toolJob->output_file, PATHINFO_EXTENSION);
        $downloadName = pathinfo($originalFilename, PATHINFO_FILENAME) . '.' . $extension;

        return Storage::disk('temp')->download($toolJob->output_file, $downloadName);
    }
}
