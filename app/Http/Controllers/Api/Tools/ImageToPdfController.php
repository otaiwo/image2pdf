<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImageToPdfRequest;
use App\Jobs\ConvertImageToPdfJob;
use App\Models\ToolJob;
use App\Services\Pdf\ImageToPdfService;
use App\Services\Storage\TempFileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageToPdfController extends Controller
{
    protected $pdfService;
    protected $tempFileService;

    public function __construct(ImageToPdfService $pdfService, TempFileService $tempFileService)
    {
        $this->pdfService = $pdfService;
        $this->tempFileService = $tempFileService;
    }

    public function upload(ImageToPdfRequest $request): JsonResponse
    {
        $jobId = Str::uuid()->toString();
        $images = $request->file('images');
        $uploadedFiles = [];

        foreach ($images as $image) {
            $fileInfo = $this->tempFileService->storeImage($image, $jobId);
            $uploadedFiles[] = $fileInfo['path'];
        }

        $originalFilename = count($images) > 0 ? $images[0]->getClientOriginalName() : 'images.pdf';

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'image_to_pdf',
            'status' => 'pending',
            'input_files' => $uploadedFiles,
            'metadata' => [
                'original_filename' => $originalFilename,
                'options' => $request->input('options', []),
            ],
        ]);

        ConvertImageToPdfJob::dispatch($jobId, $request->input('options', []));

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $jobId,
                'status' => 'pending',
                'check_status_url' => route('api.tools.image-to-pdf.status', $jobId),
                'download_url' => route('api.tools.image-to-pdf.download', $jobId),
            ]
        ], 202);
    }

    public function status(string $jobId): JsonResponse
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        $originalName = $toolJob->metadata['original_filename'] ?? 'converted';
        $filename = pathinfo($originalName, PATHINFO_FILENAME) . '.pdf';

        return response()->json([
            'success' => true,
            'data' => [
                'job_id' => $toolJob->job_id,
                'status' => $toolJob->status,
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
                'created_at' => $toolJob->created_at->toIso8601String(),
                'is_completed' => $toolJob->status === 'completed',
                'filename' => $filename,
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.image-to-pdf.download', $jobId) : null,
            ],
        ]);
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'PDF not ready'], 404);
        }

        if (!Storage::disk('temp')->exists($toolJob->output_file)) {
            return response()->json(['success' => false, 'message' => 'File not found'], 404);
        }

        $originalName = $toolJob->metadata['original_filename'] ?? 'converted';
        $filename = pathinfo($originalName, PATHINFO_FILENAME) . '.pdf';

        return Storage::disk('temp')->download($toolJob->output_file, $filename);
    }
}
