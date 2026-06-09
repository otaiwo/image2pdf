<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;

/**
 * Standardized API response wrapper for consistent response formatting.
 * Provides output sanitization for user-controlled content to prevent XSS.
 */
class ApiResponse
{
    /**
     * Create a success response.
     *
     * @param mixed $data
     * @param string $message
     * @param int $statusCode
     * @return JsonResponse
     */
    public static function success(mixed $data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Create an error response.
     *
     * @param string $message
     * @param int $statusCode
     * @param mixed $data
     * @return JsonResponse
     */
    public static function error(string $message, int $statusCode = 400, mixed $data = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Sanitize a string to prevent XSS in API responses.
     * Strips HTML tags and encodes special characters.
     * This is defense-in-depth — JSON APIs are generally safe,
     * but user-controlled content should never contain raw HTML.
     *
     * @param string|null $value The string to sanitize
     * @param int $maxLength Maximum allowed length (0 = no limit)
     * @return string|null Sanitized string
     */
    public static function sanitize(?string $value, int $maxLength = 0): ?string
    {
        if ($value === null) {
            return null;
        }

        // Strip HTML tags to prevent XSS
        $value = strip_tags($value);

        // Encode any remaining special characters (double_encode enabled for safety)
        $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8', true);

        // Truncate if max length is specified
        if ($maxLength > 0 && mb_strlen($value) > $maxLength) {
            $value = mb_substr($value, 0, $maxLength) . '...';
        }

        return $value;
    }

    /**
     * Recursively sanitize all string values in an array.
     *
     * @param array $data
     * @return array
     */
    public static function sanitizeArray(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $data[$key] = self::sanitize($value);
            } elseif (is_array($value)) {
                $data[$key] = self::sanitizeArray($value);
            }
        }
        return $data;
    }
}