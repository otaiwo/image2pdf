<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function recentActivity(Request $request): JsonResponse
    {
        // For now, allow both guest (IP-based) and authenticated history
        $userId = $request->user()?->id;

        $query = ToolJob::query();

        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            // Limited history for guests
            $query->whereNull('user_id')
                  ->where('created_at', '>=', now()->subHours(24));
        }

        $jobs = $query->latest()
            ->limit(10)
            ->get()
            ->map(function ($job) {
                return [
                    'job_id' => $job->job_id,
                    'type' => $job->type,
                    'status' => $job->status,
                    'created_at' => $job->created_at->diffForHumans(),
                    'filename' => $job->metadata['original_filename'] ?? ($job->metadata['filename'] ?? 'document.pdf'),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    }
}
