<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;

class HealthController extends Controller
{
    /**
     * Health check endpoint - used for load balancers and monitoring
     */
    public function health(): JsonResponse
    {
        $status = $this->checkHealth();

        return response()->json(
            $status,
            $status['status'] === 'healthy' ? 200 : 503
        );
    }

    /**
     * Detailed status endpoint - for comprehensive monitoring
     */
    public function status(): JsonResponse
    {
        return response()->json($this->getDetailedStatus());
    }

    /**
     * Check overall health
     */
    private function checkHealth(): array
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'cache' => $this->checkCache(),
        ];

        $allHealthy = collect($checks)->every(fn($check) => $check['healthy'] === true);

        return [
            'status' => $allHealthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'app_version' => config('app.version', '1.0.0'),
            'checks' => $checks,
        ];
    }

    /**
     * Get detailed status
     */
    private function getDetailedStatus(): array
    {
        $health = $this->checkHealth();

        return array_merge($health, [
            'uptime' => $this->getUptime(),
            'memory_usage' => $this->getMemoryUsage(),
            'queue_jobs' => $this->getQueueJobCount(),
        ]);
    }

    /**
     * Check database connectivity
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();

            return [
                'healthy' => true,
                'message' => 'Database connected',
                'database' => config('database.default'),
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Database connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check Redis connectivity
     */
    private function checkRedis(): array
    {
        try {
            if (config('queue.default') === 'redis' || config('cache.default') === 'redis') {
                Redis::connection()->ping();

                return [
                    'healthy' => true,
                    'message' => 'Redis connected',
                ];
            }

            return [
                'healthy' => true,
                'message' => 'Redis not configured',
            ];
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Redis connection failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check cache functionality
     */
    private function checkCache(): array
    {
        try {
            $testKey = 'health_check_' . time();
            Cache::put($testKey, 'ok', 60);
            $value = Cache::get($testKey);
            Cache::forget($testKey);

            if ($value === 'ok') {
                return [
                    'healthy' => true,
                    'message' => 'Cache working',
                ];
            }

            throw new \Exception('Cache test failed');
        } catch (\Exception $e) {
            return [
                'healthy' => false,
                'message' => 'Cache check failed',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get application uptime
     */
    private function getUptime(): string
    {
        // This is a simple implementation. For real uptime, use process monitoring
        return 'N/A (use process monitoring)';
    }

    /**
     * Get memory usage
     */
    private function getMemoryUsage(): array
    {
        return [
            'current_mb' => round(memory_get_usage() / 1024 / 1024, 2),
            'peak_mb' => round(memory_get_peak_usage() / 1024 / 1024, 2),
            'limit_mb' => (int) ini_get('memory_limit'),
        ];
    }

    /**
     * Get pending queue jobs count
     */
    private function getQueueJobCount(): int
    {
        try {
            // This varies by queue driver
            return \App\Models\ToolJob::where('status', 'pending')->count();
        } catch (\Exception $e) {
            return 0;
        }
    }
}
