<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class PageNumberService
{
    /**
     * Add page numbers to a PDF file.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param array $options position, font_size, color, start_at
     * @return string PDF content with page numbers
     */
    public function addPageNumbers(string $filePath, array $options = []): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_num');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();
        $startAt = (int) ($options['start_at'] ?? 1);
        $position = $options['position'] ?? 'bottom_center';

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);

                $pdf->SetFont('Arial', '', $options['font_size'] ?? 10);
                $pdf->SetTextColor(128, 128, 128);

                $text = ($i + $startAt - 1);
                $w = $pdf->GetStringWidth($text);

                [$x, $y] = $this->calculatePosition($size, $w, $position);
                $pdf->Text($x, $y, $text);
            }
        } finally {
            if (file_exists($tempFile)) unlink($tempFile);
        }

        return $pdf->Output('S');
    }

    private function calculatePosition($size, $textWidth, $pos): array
    {
        $margin = 10;
        $width = $size['width'];
        $height = $size['height'];

        return match ($pos) {
            'bottom_left' => [$margin, $height - $margin],
            'bottom_right' => [$width - $margin - $textWidth, $height - $margin],
            'top_left' => [$margin, $margin + 10],
            'top_right' => [$width - $margin - $textWidth, $margin + 10],
            'top_center' => [($width - $textWidth) / 2, $margin + 10],
            'bottom_center' => [($width - $textWidth) / 2, $height - $margin],
            default => [($width - $textWidth) / 2, $height - $margin],
        };
    }
}
