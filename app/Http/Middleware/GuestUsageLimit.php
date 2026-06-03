<?php

namespace App\Http\Middleware;

use App\Services\RateLimitService;
use Closure;
use Illuminate\Http\Request;
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

        // Allow all GET requests without counting towards the limit
        if ($request->isMethod('GET')) {
            return $next($request);
        }

        $ip = $request->ip() ?? 'unknown';
        $key = 'guest_usage:' . $ip;
        $limit = (int)config('services.guest_limit.count', 100);
        $expiration = (int)config('services.guest_limit.decay', 86400);

        // Check rate limit
        $check = RateLimitService::checkAndIncrement($key, $limit, $expiration, false);

        if (!$check['allowed']) {
            return response()->json([
                'success' => false,
                'message' => 'Daily limit reached for guest access. Please sign up for unlimited access.',
                'code' => 'GUEST_LIMIT_REACHED'
            ], 429);
        }

        // Process the request
        $response = $next($request);

        // Increment only on successful POST operations
        if ($this->isSuccessfulOperation($response)) {
            RateLimitService::increment($key, $expiration);
        }

        return $response;
    }

    /**
     * Check if response indicates a successful operation
     */
    private function isSuccessfulOperation(mixed $response): bool
    {
        if (!method_exists($response, 'getStatusCode')) {
            return false;
        }

        $status = $response->getStatusCode();
        if (!in_array($status, [200, 201, 202])) {
            return false;
        }

        if (method_exists($response, 'getData')) {
            $data = $response->getData(true);
            return ($data['success'] ?? false) === true;
        }

        return false;
    }
}

