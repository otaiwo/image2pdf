<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // 1. Must be http or https only
        if (!preg_match('#^https?://#i', $value)) {
            $fail('Only HTTP and HTTPS URLs are allowed.');
            return;
        }

        $parsed = parse_url($value);

        if (!$parsed || empty($parsed['host'])) {
            $fail('The :attribute must be a valid URL.');
            return;
        }

        $host = strtolower($parsed['host']);

        // 2. Block raw IPs (use a domain, not an IP address)
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $fail('IP address URLs are not allowed.');
            return;
        }

        // 3. Resolve the hostname and block private/reserved ranges
        $ip = gethostbyname($host);

        if ($ip === $host) {
            // DNS resolution failed
            $fail('The URL hostname could not be resolved.');
            return;
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
            $fail('URLs resolving to private or reserved IP ranges are not allowed.');
            return;
        }

        // 4. Block common internal hostnames
        $blockedHosts = ['localhost', 'metadata.google.internal'];
        if (in_array($host, $blockedHosts, true)) {
            $fail('This URL is not allowed.');
            return;
        }
    }
}