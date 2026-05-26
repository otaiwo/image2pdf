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

        // Allow all GET requests (e.g., downloads) without counting towards the limit
        if ($request->isMethod('GET')) {
            return $next($request);
        }

        $ip = $request->ip() ?? 'unknown';
        $key = 'guest_usage:' . $ip;
        $limit = 100; // 100 successful operations per day for guests
        $expiration = 86400; // 24 hours

        $usage = Cache::get($key, 0);

        if ($usage >= $limit) {
            return response()->json([
                'success' => false,
                'message' => 'Daily limit reached for guest access. Please sign up for unlimited access.',
                'code' => 'GUEST_LIMIT_REACHED'
            ], 429);
        }

        // Process the request first
        $response = $next($request);

        // Increment only on successful POST operations (status 200/201/202 and success flag true)
        if ($request->isMethod('POST') && method_exists($response, 'getStatusCode')) {
            $status = $response->getStatusCode();
            if (in_array($status, [200, 201, 202])) {
                $data = method_exists($response, 'getData') ? $response->getData(true) : [];
                $isSuccessful = ($data['success'] ?? false) === true;
                if ($isSuccessful) {
                    Cache::put($key, $usage + 1, $expiration);
                }
            }
        }

        return $response;
    }
}
