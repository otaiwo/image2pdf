<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class OrganizePdfService
{
    /**
     * Remove pages from a PDF.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param array $pagesToRemove Array of page numbers to exclude
     * @return string Organized PDF content
     */
    public function removePages(string $filePath, array $pagesToRemove): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_org');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            for ($i = 1; $i <= $pageCount; $i++) {
                if (in_array($i, $pagesToRemove)) {
                    continue;
                }

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
