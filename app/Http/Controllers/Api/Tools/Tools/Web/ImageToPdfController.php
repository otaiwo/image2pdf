<?php

namespace App\Http\Controllers\Tools\Web;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use Illuminate\Support\Facades\Storage;

class ImageToPdfController extends Controller
{
    public function index()
    {
        return view('converter'); // your React SPA entry
    }

    public function download(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        if (!$toolJob->is_completed) {
            abort(404, 'PDF conversion is not complete yet.');
        }

        if (!Storage::exists($toolJob->result_path)) {
            abort(404, 'File not found.');
        }

        return Storage::download($toolJob->result_path, $toolJob->filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function progress(string $jobId)
    {
        $toolJob = ToolJob::where('job_id', $jobId)->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $toolJob->status,
                'is_completed' => $toolJob->is_completed,
                'progress' => $toolJob->progress,
            ]
        ]);
    }
}
