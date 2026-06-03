<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class RateLimitService
{
    /**
     * Check and increment a rate limit for a key
     */
    public static function checkAndIncrement(
        string $key,
        int $limit,
        int $expirationSeconds,
        bool $incrementOnCheck = true
    ): array {
        $current = Cache::get($key, 0);

        if ($current >= $limit) {
            return [
                'allowed' => false,
                'current' => $current,
                'limit' => $limit,
            ];
        }

        if ($incrementOnCheck) {
            if (!Cache::has($key)) {
                Cache::put($key, 1, $expirationSeconds);
            } else {
                Cache::increment($key);
            }
        }

        return [
            'allowed' => true,
            'current' => $current,
            'limit' => $limit,
        ];
    }

    /**
     * Get current count for a key without incrementing
     */
    public static function getCount(string $key): int
    {
        return Cache::get($key, 0);
    }

    /**
     * Increment a key's count
     */
    public static function increment(string $key, int $expirationSeconds, int $amount = 1): int
    {
        if (!Cache::has($key)) {
            Cache::put($key, $amount, $expirationSeconds);
            return $amount;
        }

        return Cache::increment($key, $amount);
    }
}
