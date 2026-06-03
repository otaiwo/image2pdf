<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Traits\AuthorizesToolJobs;
use App\Http\Traits\PerformsUploadValidation;
use App\Jobs\FileConverterJob;
use App\Models\ToolJob;
use App\Services\Pdf\FileUploadValidationService;
use App\Services\Storage\TempFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileConverterController extends Controller
{
    use AuthorizesToolJobs;
    use PerformsUploadValidation;

    protected $tempFileService;

    public function __construct(TempFileService $tempFileService)
    {
        $this->tempFileService = $tempFileService;
    }

    public function upload(Request $request): JsonResponse
    {
        $type = $request->input('type');

        $validated = $request->validate([
            'type' => 'required|string|in:file_to_pdf,pdf_to_txt,pdf_to_docx,pdf_to_xlsx,pdf_to_pptx',
            'file' => [
                'required',
                'file',
                'max:20480', // 20MB
                $type === 'file_to_pdf' 
                    ? 'mimes:txt,docx,pptx,xls,xlsx' 
                    : 'mimes:pdf'
            ],
            'options' => 'nullable|array',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());
        
        // Map conversion type to action type for validation
        $actionTypeMap = [
            'file_to_pdf' => FileUploadValidationService::ACTION_FILE_TO_PDF,
            'pdf_to_txt' => FileUploadValidationService::ACTION_CONVERT_TO_TEXT,
            'pdf_to_docx' => FileUploadValidationService::ACTION_CONVERT_TO_DOCX,
            'pdf_to_xlsx' => FileUploadValidationService::ACTION_CONVERT_TO_XLSX,
            'pdf_to_pptx' => FileUploadValidationService::ACTION_CONVERT_TO_PPTX,
        ];
        
        // Perform uniform upload validation
        $validationResult = $this->validateUploadFile(
            $file,
            $actionTypeMap[$type] ?? $type,
            $validated['options'] ?? []
        );

        $jobId = Str::uuid()->toString();

        $filename = Str::random(40) . '.' . $extension;
        $path = "uploads/{$jobId}/{$filename}";

        $stream = fopen($file->getRealPath(), 'r');
        Storage::disk('temp')->put($path, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }

        // Store validation results in metadata
        $metadata = [
            'original_filename' => $file->getClientOriginalName(),
            'options' => $validated['options'] ?? [],
            'validation_result' => $validationResult,
            'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
        ];

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => $validated['type'],
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => $metadata,
        ]);

        FileConverterJob::dispatch($jobId, $validated['type'], $validated['options'] ?? []);

        return response()->json(
            $this->getValidationResponse(
                $validationResult,
                $jobId,
                [
                    'status' => 'pending',
                    'check_status_url' => route('api.tools.file-converter.status', $jobId),
                ]
            ),
            202
        );
    }

    public function status(string $jobId): JsonResponse
    {
        $toolJob = $this->findAuthorizedToolJob($jobId);

        $filename = $toolJob->metadata['original_filename'] ?? 'converted';
        if ($toolJob->status === 'completed' && $toolJob->output_file) {
            $extension = pathinfo($toolJob->output_file, PATHINFO_EXTENSION);
            $filename = pathinfo($filename, PATHINFO_FILENAME) . '.' . $extension;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'type' => $toolJob->type,
                'filename' => $filename,
                'created_at' => $toolJob->created_at->toIso8601String(),
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'is_completed' => $toolJob->status === 'completed',
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.file-converter.download', $jobId) : null,
                'error' => $toolJob->metadata['error'] ?? null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = $this->findAuthorizedToolJob($jobId);

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'File not ready'], 404);
        }

        $originalFilename = $toolJob->metadata['original_filename'] ?? 'converted';
        $extension = pathinfo($toolJob->output_file, PATHINFO_EXTENSION);
        $downloadName = pathinfo($originalFilename, PATHINFO_FILENAME) . '.' . $extension;

        return $this->downloadTempFile($toolJob->output_file, $downloadName);
    }
}
