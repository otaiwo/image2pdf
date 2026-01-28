<?php

namespace App\Services\Pdf;

use Spatie\PdfToImage\Pdf;
use Intervention\Image\ImageManager;
use App\Services\Storage\TempFileService;

class ImageToPdfService
{
    private $tempFileService;
    private $imageManager;

    public function __construct(TempFileService $tempFileService)
    {
        $this->tempFileService = $tempFileService;
        $this->imageManager = new ImageManager(['driver' => 'gd']);
    }

    public function convertImagesToPdf(array $imagePaths, array $options = [])
    {
        $pdf = new \Spatie\Pdf\Pdf();

        foreach ($imagePaths as $imagePath) {
            $imageContent = $this->tempFileService->getFile($imagePath);
            $image = $this->imageManager->make($imageContent);

            // Resize if needed
            if (isset($options['max_width']) || isset($options['max_height'])) {
                $image->resize(
                    $options['max_width'] ?? null,
                    $options['max_height'] ?? null,
                    function ($constraint) {
                        $constraint->aspectRatio();
                        $constraint->upsize();
                    }
                );
            }

            // Convert to PDF page
            $pdf->addPage($image->encode('jpg'));
        }

        // Set PDF options
        $pdfOptions = array_merge([
            'format' => 'A4',
            'orientation' => 'portrait',
            'margin' => 20,
        ], $options);

        return $pdf->get($pdfOptions);
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
