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
        $uploadedFiles = [];

        foreach ($request->file('images') as $image) {
            $fileInfo = $this->tempFileService->storeImage($image, $jobId);
            $uploadedFiles[] = $fileInfo['path'];
        }

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'image_to_pdf',
            'status' => 'pending',
            'input_files' => $uploadedFiles,
            'metadata' => [
                'filename' => 'converted-' . time() . '.pdf',
                'options' => $request->input('options', []),
            ],
        ]);

        ConvertImageToPdfJob::dispatch($jobId, $request->input('options', []));

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => 'pending',
            'check_status_url' => route('api.tools.image-to-pdf.status', $jobId),
            'download_url' => route('api.tools.image-to-pdf.download', $jobId),
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
                'download_url' => $toolJob->status === 'completed' ? route('api.tools.image-to-pdf.download', $jobId) : null,
            ],
        ]);
    }

    public function download(string $jobId): JsonResponse
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'PDF not ready'], 404);
        }

        return response()->json([
            'success' => true,
            'download_url' => Storage::disk('temp')->url($toolJob->output_file),
        ]);
    }
}
