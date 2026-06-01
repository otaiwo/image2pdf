<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        $corsConfig = config('cors');
        $allowedOrigins = $corsConfig['allowed_origins'] ?? [env('APP_URL', 'http://localhost')];
        
        $origin = $request->header('Origin');
        $response = $next($request);

        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } elseif (!empty($corsConfig['allowed_origins_patterns'])) {
            foreach ($corsConfig['allowed_origins_patterns'] as $pattern) {
                if (preg_match($pattern, $origin)) {
                    $response->headers->set('Access-Control-Allow-Origin', $origin);
                    break;
                }
            }
        }

        if ($request->isMethod('OPTIONS')) {
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if ($corsConfig['supports_credentials'] ?? false) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
            
            if ($corsConfig['max_age'] ?? 0 > 0) {
                $response->headers->set('Access-Control-Max-Age', $corsConfig['max_age']);
            }
        }

        return $response;
    }
}