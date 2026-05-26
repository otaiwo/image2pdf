<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RateLimitUploads
{
    public function handle(Request $request, Closure $next)
    {
        $key = 'upload_limit:' . ($request->ip() ?? 'anonymous');
        $limit = 100; // 100 successful uploads per day
        $decay = 86400; // 24 hours

        // Get current count (default 0)
        $current = Cache::get($key, 0);

        // If limit reached, block the request
        if ($current >= $limit) {
            return response()->json([
                'error' => 'Upload limit exceeded. Please try again later.'
            ], 429);
        }

        // Ensure the key exists with proper expiration before potentially incrementing
        if (!Cache::has($key)) {
            Cache::add($key, 0, $decay);
        }

        // Process the request
        $response = $next($request);

        // Increment only on successful uploads (status 200/201/202 and success flag true)
        $isSuccessful = false;
        if (method_exists($response, 'getStatusCode')) {
            $status = $response->getStatusCode();
            if (in_array($status, [200, 201, 202])) {
                // Try to read JSON success flag if present
                $data = method_exists($response, 'getData') ? $response->getData(true) : [];
                $isSuccessful = ($data['success'] ?? false) === true;
            }
        }

        if ($isSuccessful) {
            Cache::increment($key);
        }

        return $response;
    }
}
