<?php

namespace App\Http\Traits;

use App\Models\ToolJob;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

trait AuthorizesToolJobs
{
    protected function findAuthorizedToolJob(string $jobId, ?string $type = null): ToolJob
    {
        if (!Str::isUuid($jobId)) {
            abort(400, 'Invalid job ID format');
        }

        $query = ToolJob::query()->where('job_id', $jobId);

        if ($type !== null) {
            $query->where('type', $type);
        }

        $toolJob = $query->firstOrFail();
        $currentUserId = Auth::id();

        if ($toolJob->user_id !== null && (string) $toolJob->user_id !== (string) $currentUserId) {
            abort(403, 'Unauthorized');
        }

        return $toolJob;
    }

    protected function assertSafeTempPath(?string $filePath): void
    {
        if (!$filePath || !Storage::disk('temp')->exists($filePath)) {
            abort(404, 'File not found');
        }

        $path = str_replace('\\', '/', $filePath);

        $segments = array_filter(explode('/', $path), static fn (string $segment): bool => $segment !== '');

        if (str_contains($path, "\0") || str_starts_with($path, '/') || preg_match('/^[A-Za-z]:\//', $path) || in_array('..', $segments, true)) {
            abort(400, 'Invalid file path');
        }

        $basePath = realpath(storage_path('app/temp'));
        $realPath = realpath(Storage::disk('temp')->path($filePath));

        $normalizedBasePath = rtrim($basePath ?: '', DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        $normalizedRealPath = rtrim($realPath ?: '', DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;

        if ($basePath === false || $realPath === false || !str_starts_with($normalizedRealPath, $normalizedBasePath)) {
            abort(400, 'Invalid file path');
        }
    }

    protected function downloadTempFile(?string $filePath, string $downloadName): BinaryFileResponse
    {
        $this->assertSafeTempPath($filePath);

        return response()->download(Storage::disk('temp')->path($filePath), $downloadName);
    }
}
