<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class CompressPdfService
{
    /**
     * Compress a PDF by re-saving it through FPDI.
     * This typically reduces size if the original has redundant metadata or uncompressed streams,
     * though FPDI is not a dedicated compression engine.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $level 'low', 'medium', 'high' (placeholder for future implementation)
     * @return string Compressed PDF content
     */
    public function compress(string $filePath, string $level = 'medium'): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_comp');
        file_put_contents($tempFile, $content);

        // FPDI doesn't actually compress much, but we can set compression to true for FPDF.
        $pdf = new Fpdi();
        $pdf->SetCompression(true);

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);
            }
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }

        return $pdf->Output('S');
    }
}
