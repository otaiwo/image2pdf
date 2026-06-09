<?php

namespace App\Services\Pdf;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use App\Services\Storage\TempFileService;
use Illuminate\Http\UploadedFile;
use Spatie\LaravelPdf\Facades\Pdf;

class ImageToPdfService
{
    private TempFileService $tempFileService;
    private ImageManager $imageManager;

    private const ALLOWED_PAGE_SIZES = [
        'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'letter', 'legal',
    ];

    private const ALLOWED_ORIENTATIONS = ['portrait', 'landscape'];

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

        $format = $this->sanitizePageSize($options['pageSize'] ?? $options['format'] ?? 'a4');
        $orientation = $this->sanitizeOrientation($options['orientation'] ?? 'portrait');

        $pdf = Pdf::view('pdf.image-to-pdf', ['images' => $base64Images])
            ->format(strtolower($format))
            ->orientation($orientation);

        return base64_decode($pdf->base64());
    }

    /**
     * Sanitize and validate the page size option.
     * Falls back to 'a4' if an invalid value is provided.
     */
    private function sanitizePageSize(mixed $pageSize): string
    {
        $pageSize = strtolower((string) $pageSize);

        if (in_array($pageSize, self::ALLOWED_PAGE_SIZES, true)) {
            return $pageSize;
        }

        return 'a4';
    }

    /**
     * Sanitize and validate the orientation option.
     * Falls back to 'portrait' if an invalid value is provided.
     */
    private function sanitizeOrientation(mixed $orientation): string
    {
        $orientation = strtolower((string) $orientation);

        if (in_array($orientation, self::ALLOWED_ORIENTATIONS, true)) {
            return $orientation;
        }

        return 'portrait';
    }

    public function validateImage(UploadedFile $file)
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