<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class SignPdfService
{
    /**
     * Add a signature image to a PDF.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $signaturePath Path to the signature image
     * @param array $options position_x, position_y, width, height, page
     * @return string Signed PDF content
     */
    public function sign(string $filePath, string $signaturePath, array $options = []): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_sign');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();
        $targetPage = (int) ($options['page'] ?? 1);

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);

                if ($i === $targetPage) {
                    // Intervention Image can help normalize the signature if needed
                    // but FPDF supports PNG/JPG directly.
                    $pdf->Image(
                        $signaturePath,
                        $options['x'] ?? 10,
                        $options['y'] ?? 10,
                        $options['width'] ?? 50,
                        $options['height'] ?? 0
                    );
                }
            }
        } finally {
            if (file_exists($tempFile)) unlink($tempFile);
        }

        return $pdf->Output('S');
    }
}
