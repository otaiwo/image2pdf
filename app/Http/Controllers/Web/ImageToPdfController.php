<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use Illuminate\Support\Facades\Storage;

class ImageToPdfController extends Controller
{
    public function index()
    {
        return view('converter');
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if ($toolJob->status !== 'completed') {
            abort(404, 'PDF conversion is not complete yet.');
        }

        if (!Storage::disk('temp')->exists($toolJob->output_file)) {
            abort(404, 'File not found.');
        }

        $filename = $toolJob->metadata['filename'] ?? 'converted.pdf';

        return Storage::disk('temp')->download($toolJob->output_file, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function status(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $toolJob->status,
                'is_completed' => $toolJob->status === 'completed',
                'progress' => $toolJob->status === 'completed' ? 100 : ($toolJob->status === 'processing' ? 50 : 0),
            ]
        ]);
    }
}
