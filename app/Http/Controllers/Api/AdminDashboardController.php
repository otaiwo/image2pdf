<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalJobs = ToolJob::count();
        $completedJobs = ToolJob::where('status', 'completed')->count();
        $failedJobs = ToolJob::where('status', 'failed')->count();
        $totalUsers = User::count();

        $usageByType = ToolJob::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();

        $recentJobs = ToolJob::latest()
            ->limit(20)
            ->get()
            ->map(function ($job) {
                return [
                    'job_id' => $job->job_id,
                    'type' => $job->type,
                    'status' => $job->status,
                    'created_at' => $job->created_at->toDateTimeString(),
                    'user' => $job->user_id ? 'Authenticated' : 'Guest',
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'metrics' => [
                    'total_jobs' => $totalJobs,
                    'completed_jobs' => $completedJobs,
                    'failed_jobs' => $failedJobs,
                    'total_users' => $totalUsers,
                    'success_rate' => $totalJobs > 0 ? round(($completedJobs / $totalJobs) * 100, 2) : 0,
                ],
                'usage_by_type' => $usageByType,
                'recent_jobs' => $recentJobs,
            ]
        ]);
    }
}
