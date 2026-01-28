<?php

namespace App\Services\Storage;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TempFileService
{
    private $disk;
    private $retentionHours = 1;

    public function __construct()
    {
        $this->disk = Storage::disk('temp');
    }

    public function storeImage($file, $jobId)
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::random(40) . '.' . $extension;
        $path = "images/{$jobId}/{$filename}";

        $this->disk->put($path, file_get_contents($file));

        return [
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    public function storePdf($content, $jobId)
    {
        $filename = Str::random(40) . '.pdf';
        $path = "pdfs/{$jobId}/{$filename}";

        $this->disk->put($path, $content);

        return $path;
    }

    public function getFileUrl($path)
    {
        return $this->disk->url($path);
    }

    public function getFile($path)
    {
        return $this->disk->get($path);
    }

    public function deleteFile($path)
    {
        if ($this->disk->exists($path)) {
            return $this->disk->delete($path);
        }
        return false;
    }

    public function deleteDirectory($directory)
    {
        if ($this->disk->exists($directory)) {
            return $this->disk->deleteDirectory($directory);
        }
        return false;
    }

    public function cleanupOldFiles()
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
