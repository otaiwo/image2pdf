<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class SplitPdfService
{
    /**
     * Split a PDF file by extracting a range of pages.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param array $pages Array of page numbers to extract
     * @return string Split PDF content
     */
    public function split(string $filePath, array $pages): string
    {
        $content = Storage::disk('temp')->get($filePath);

        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_split');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();

        try {
            $pdf->setSourceFile($tempFile);
            foreach ($pages as $pageNo) {
                $templateId = $pdf->importPage($pageNo);
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

    /**
     * Get the total number of pages in a PDF.
     */
    public function getPageCount(string $filePath): int
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_count');
        file_put_contents($tempFile, $content);

        try {
            $pdf = new Fpdi();
            return $pdf->setSourceFile($tempFile);
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }
}
