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

    /**
     * Add a text watermark to a PDF provided as raw content.
     *
     * This method is useful when the PDF is already loaded in memory (e.g.,
     * after merging PDFs) and there is no stored file on the "temp" disk.
     * It writes the content to a temporary file, applies the same FPDI logic
     * as {@see addTextWatermark()}, and then returns the watermarked PDF as a
     * string.
     *
     * @param string $pdfContent The raw PDF binary data.
     * @param string $text       The watermark text.
     * @param array  $options    Optional settings such as font size or color.
     * @return string            Watermarked PDF content.
     */
    public function addTextWatermarkFromContent(string $pdfContent, string $text, array $options = []): string
    {
        // Write the PDF content to a temporary file for FPDI processing.
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_wm');
        file_put_contents($tempFile, $pdfContent);

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
                $pdf->SetTextColor(
                    $options['color']['r'] ?? 150,
                    $options['color']['g'] ?? 150,
                    $options['color']['b'] ?? 150
                );

                // Center the text (simple approximation)
                $x = $size['width'] / 2;
                $y = $size['height'] / 2;
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
