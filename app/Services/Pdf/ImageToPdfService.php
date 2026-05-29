<?php

namespace App\Services\Pdf;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Services\Storage\TempFileService;
use Spatie\LaravelPdf\Facades\Pdf;

class ImageToPdfService
{
    private $tempFileService;
    private $imageManager;

    public function __construct(TempFileService $tempFileService)
    {
        $this->tempFileService = $tempFileService;
        $this->imageManager = new ImageManager(new Driver());
    }

    public function convertImagesToPdf(array $imagePaths, array $options = [])
    {
        $base64Images = [];

        foreach ($imagePaths as $imagePath) {
            $imageContent = $this->tempFileService->getFile($imagePath);
            $base64Images[] = 'data:image/jpeg;base64,' . base64_encode($imageContent);
        }

        // Map 'pageSize' from frontend to 'format' for Spatie PDF
        $format = $options['pageSize'] ?? $options['format'] ?? 'a4';

        $pdf = Pdf::view('pdf.image-to-pdf', ['images' => $base64Images])
            ->format(strtolower($format))
            ->orientation($options['orientation'] ?? 'portrait');

        return base64_decode($pdf->base64());
    }

    public function validateImage($file)
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
        $maxSize = 10 * 1024 * 1024; // 10MB

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception('Invalid image format. Allowed: JPEG, PNG, GIF, WebP, BMP');
        }

        if ($file->getSize() > $maxSize) {
            throw new \Exception('Image size too large. Maximum: 10MB');
        }

        return true;
    }
}
