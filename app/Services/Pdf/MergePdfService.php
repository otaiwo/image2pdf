<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class MergePdfService
{
    /**
     * Merge multiple PDF files into one.
     *
     * @param array $filePaths Array of file paths on the 'temp' disk
     * @return string Merged PDF content
     */
    public function merge(array $filePaths): string
    {
        $pdf = new Fpdi();

        foreach ($filePaths as $filePath) {
            $content = Storage::disk('temp')->get($filePath);

            // Create a temporary file to work with FPDI
            $tempFile = tempnam(sys_get_temp_dir(), 'pdf_merge');
            file_put_contents($tempFile, $content);

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
        }

        return $pdf->Output('S');
    }
}
