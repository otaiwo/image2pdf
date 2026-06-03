<?php

namespace App\Http\Middleware;

use App\Services\RateLimitService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class RateLimitUploads
{
    public function handle(Request $request, Closure $next)
    {
        $key = 'upload_limit:' . ($request->ip() ?? 'anonymous');
        $limit = (int)config('services.upload_limit.count', 100);
        $decay = (int)config('services.upload_limit.decay', 86400);

        // Check rate limit
        $check = RateLimitService::checkAndIncrement($key, $limit, $decay, false);

        if (!$check['allowed']) {
            return response()->json([
                'success' => false,
                'message' => 'Upload limit exceeded. Please try again later.',
                'code' => 'RATE_LIMIT_EXCEEDED',
            ], 429);
        }

        // Process the request
        $response = $next($request);

        // Increment only on successful uploads
        if ($this->isSuccessfulUpload($response)) {
            RateLimitService::increment($key, $decay);
        }

        return $response;
    }

    /**
     * Check if response indicates a successful upload
     */
    private function isSuccessfulUpload(mixed $response): bool
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
