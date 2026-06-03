<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Cors
{
    public function handle(Request $request, Closure $next): Response
    {
        $corsConfig = config('cors');
        $allowedOrigins = $corsConfig['allowed_origins'] ?? [env('APP_URL', 'http://localhost')];
        
        $origin = $request->header('Origin');
        $response = $next($request);

        // Check if origin is in whitelist
        $originAllowed = false;

        if ($origin && in_array($origin, $allowedOrigins)) {
            $originAllowed = true;
        } elseif ($origin && !empty($corsConfig['allowed_origins_patterns'])) {
            foreach ($corsConfig['allowed_origins_patterns'] as $pattern) {
                if (preg_match($pattern, $origin)) {
                    $originAllowed = true;
                    break;
                }
            }
        }

        if ($originAllowed && $origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        }

        if ($request->isMethod('OPTIONS')) {
            $response->headers->set(
                'Access-Control-Allow-Methods',
                implode(', ', $corsConfig['allowed_methods'] ?? ['GET', 'POST', 'PUT', 'DELETE'])
            );
            $response->headers->set(
                'Access-Control-Allow-Headers',
                implode(', ', $corsConfig['allowed_headers'] ?? ['*'])
            );
            
            if ($corsConfig['supports_credentials'] ?? false) {
                $response->headers->set('Access-Control-Allow-Credentials', 'true');
            }
            
            if (($corsConfig['max_age'] ?? 0) > 0) {
                $response->headers->set('Access-Control-Max-Age', (string)$corsConfig['max_age']);
            }
        }

        // Add exposed headers
        if (!empty($corsConfig['exposed_headers'])) {
            $response->headers->set(
                'Access-Control-Expose-Headers',
                implode(', ', $corsConfig['exposed_headers'])
            );
        }

        return $response;
    }
}