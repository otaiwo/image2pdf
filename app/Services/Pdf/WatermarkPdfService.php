<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class WatermarkPdfService
{
    /**
     * Add a text watermark to a PDF file.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $text Watermark text
     * @param array $options Font size, color, opacity, etc.
     * @return string Watermarked PDF content
     */
    public function addTextWatermark(string $filePath, string $text, array $options = []): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_wm');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);

                // Add Watermark Text
                $pdf->SetFont('Arial', 'B', $options['font_size'] ?? 50);
                $pdf->SetTextColor($options['color']['r'] ?? 150, $options['color']['g'] ?? 150, $options['color']['b'] ?? 150);

                // Center rotation logic
                $x = $size['width'] / 2;
                $y = $size['height'] / 2;

                // FPDI/FPDF doesn't support transparency and rotation natively without extensions,
                // but we can do simple diagonal text for now.
                $pdf->Text($x - 50, $y, $text);
            }
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }

        return $pdf->Output('S');
    }
}
