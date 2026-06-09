<?php

namespace App\Services\Storage;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TempFileService
{
    private Filesystem $disk;
    private int $retentionHours = 1;

    public function __construct()
    {
        $this->disk = Storage::disk('temp');
    }

    public function storeImage(UploadedFile|string $file, string $jobId): array
    {
        // Validate actual image content to prevent polyglot attacks
        $this->validateImageContent($file);

        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40) . '.' . $extension;
        $path = "images/{$jobId}/{$filename}";

        // Use streaming via storeAs instead of file_get_contents to avoid memory exhaustion
        $file->storeAs("images/{$jobId}", $filename, ['disk' => 'temp']);

        return [
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    /**
     * Validate that the uploaded file is a genuine image, not a polyglot/malicious file.
     *
     * @throws \RuntimeException
     */
    private function validateImageContent(UploadedFile|string $file): void
    {
        if ($file instanceof UploadedFile) {
            $realPath = $file->getRealPath();
        } elseif (is_string($file)) {
            $realPath = $file;
        } else {
            throw new \RuntimeException('Invalid file input');
        }

        if (!$realPath || !file_exists($realPath)) {
            throw new \RuntimeException('File not found for validation');
        }

        // Use getimagesize which returns false for non-image files
        $imageInfo = @getimagesize($realPath);
        if ($imageInfo === false) {
            throw new \RuntimeException('File is not a valid image');
        }

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
        ];

        if (!in_array($imageInfo['mime'], $allowedMimeTypes, true)) {
            throw new \RuntimeException('Invalid image MIME type');
        }

        // Re-encode image to strip any embedded payloads (XSS, PHP code, etc.)
        $this->reEncodeImage($realPath, $imageInfo['mime']);
    }

    /**
     * Re-encode the image to strip embedded malicious payloads.
     * Uses GD library to decode and re-encode the image.
     */
    private function reEncodeImage(string $path, string $mimeType): void
    {
        $image = match ($mimeType) {
            'image/jpeg' => @imagecreatefromjpeg($path),
            'image/png'  => @imagecreatefrompng($path),
            'image/gif'  => @imagecreatefromgif($path),
            'image/webp' => @imagecreatefromwebp($path),
            'image/bmp'  => @imagecreatefrombmp($path),
            default      => false,
        };

        if ($image === false) {
            throw new \RuntimeException('Failed to decode image file');
        }

        ob_start();
        match ($mimeType) {
            'image/jpeg' => imagejpeg($image, null, 90),
            'image/png'  => imagepng($image, null, -1),
            'image/gif'  => imagegif($image),
            'image/webp' => imagewebp($image, null, 90),
            'image/bmp'  => imagebmp($image),
            default      => throw new \RuntimeException('Unsupported image type for re-encoding'),
        };
        $reEncodedContent = ob_get_clean();

        imagedestroy($image);

        if ($reEncodedContent === false) {
            throw new \RuntimeException('Failed to re-encode image');
        }

        file_put_contents($path, $reEncodedContent);
    }

    public function storePdf(string $content, string $jobId): string
    {
        $filename = Str::random(40) . '.pdf';
        $path = "pdfs/{$jobId}/{$filename}";

        $this->disk->put($path, $content);

        return $path;
    }

    /**
     * Returns the storage-relative path (use this to serve via a signed route
     * or controller, since local disks don't have public URLs).
     */
    public function getFileUrl(string $path): string
    {
        // Local temp disks don't support ->url().
        // Return the path and let the controller build a signed download URL.
        return $path;
    }

    public function getFile(string $path): string
    {
        return $this->disk->get($path);
    }

    public function deleteFile(string $path): bool
    {
        if ($this->disk->exists($path)) {
            return $this->disk->delete($path);
        }
        return false;
    }

    public function deleteDirectory(string $directory): bool
    {
        if ($this->disk->exists($directory)) {
            return $this->disk->deleteDirectory($directory);
        }
        return false;
    }

    public function cleanupOldFiles(): void
    {
        $cutoff = now()->subHours($this->retentionHours);

        foreach (['images', 'pdfs'] as $type) {
            $directories = $this->disk->directories($type);

            foreach ($directories as $directory) {
                $timestamp = $this->disk->lastModified($directory);
                if ($timestamp < $cutoff->timestamp) {
                    $this->deleteDirectory($directory);
                }
            }
        }
    }
}