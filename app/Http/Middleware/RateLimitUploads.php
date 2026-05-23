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
        $limit = 10; // 10 uploads
        $decay = 3600; // per hour

        if (Cache::has($key) && Cache::get($key) >= $limit) {
            return response()->json([
                'error' => 'Upload limit exceeded. Please try again later.'
            ], 429);
        }

        Cache::add($key, 0, $decay);
        Cache::increment($key);

        return $next($request);
    }
}
