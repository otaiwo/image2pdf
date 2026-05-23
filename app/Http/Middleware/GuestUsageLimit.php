<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class GuestUsageLimit
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // If user is authenticated, skip guest limits
        if ($request->user()) {
            return $next($request);
        }

        $ip = $request->ip() ?? 'unknown';
        $key = 'guest_usage:' . $ip;
        $limit = 5; // 5 operations per day for guests
        $expiration = 86400; // 24 hours

        $usage = Cache::get($key, 0);

        if ($usage >= $limit) {
            return response()->json([
                'success' => false,
                'message' => 'Daily limit reached for guest access. Please sign up for unlimited access.',
                'code' => 'GUEST_LIMIT_REACHED'
            ], 429);
        }

        // We only increment on POST requests (actual operations)
        if ($request->isMethod('POST')) {
            Cache::put($key, $usage + 1, $expiration);
        }

        return $next($request);
    }
}
