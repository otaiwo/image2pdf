<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Cors
{
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [env('APP_URL', 'http://localhost')];

        $origin = $request->header('Origin');

        $response = $next($request);

        if (in_array($origin, $allowedOrigins)) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
        } elseif (app()->environment('local')) {
            $response->headers->set('Access-Control-Allow-Origin', '*');
        }

        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Max-Age', '86400');

        if ($request->isMethod('OPTIONS')) {
            return response('', 200)->withHeaders($response->headers->all());
        }

        return $response;
    }
}