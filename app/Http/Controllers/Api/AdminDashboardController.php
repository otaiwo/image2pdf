<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ToolJob;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function stats(Request $request): JsonResponse
    {
        // Authorize admin access
        $this->authorize('viewAnalytics', User::class);

        $totalJobs = ToolJob::count();
        $completedJobs = ToolJob::where('status', 'completed')->count();
        $failedJobs = ToolJob::where('status', 'failed')->count();
        $totalUsers = User::verified()->count();

        // Fix N+1 query by using raw query
        $usageByType = ToolJob::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();

        // Get user activity stats
        $userActivity = ToolJob::select('user_id', DB::raw('count(*) as total_jobs'), DB::raw('sum(case when status = "completed" then 1 else 0 end) as completed_jobs'))
            ->where('user_id', '!=', null)
            ->groupBy('user_id')
            ->with('user:id,name,email')
            ->orderByDesc('total_jobs')
            ->limit(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'user_id' => $activity->user_id,
                    'user_email' => $activity->user?->email ?? 'Unknown',
                    'total_jobs' => $activity->total_jobs,
                    'completed_jobs' => $activity->completed_jobs ?? 0,
                ];
            });

        // Use eager loading to prevent N+1
        $recentJobs = ToolJob::with('user:id,name,email')
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($job) {
                return [
                    'job_id' => $job->job_id,
                    'type' => $job->type,
                    'status' => $job->status,
                    'created_at' => $job->created_at->toDateTimeString(),
                    'user' => $job->user ? $job->user->email : 'Guest',
                    'organization_id' => $job->organization_id,
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
                'user_activity' => $userActivity,
                'recent_jobs' => $recentJobs,
            ]
        ]);
    }
}
