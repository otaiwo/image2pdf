<?php

namespace App\Services\Pdf;

use setasign\Fpdi\Fpdi;
use Illuminate\Support\Facades\Storage;

class PdfMetadataService
{
    /**
     * Edit PDF metadata.
     *
     * @param string $filePath Path on 'temp' disk
     * @param array $metadata [title, author, subject, keywords]
     * @return string PDF content
     */
    public function editMetadata(string $filePath, array $metadata): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_meta');
        file_put_contents($tempFile, $content);

        $pdf = new Fpdi();
        try {
            $pageCount = $pdf->setSourceFile($tempFile);
            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);
                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);
            }

            // Set Metadata
            if (!empty($metadata['title'])) {
                $pdf->SetTitle($metadata['title'], true);
            }
            if (!empty($metadata['author'])) {
                $pdf->SetAuthor($metadata['author'], true);
            }
            if (!empty($metadata['subject'])) {
                $pdf->SetSubject($metadata['subject'], true);
            }
            if (!empty($metadata['keywords'])) {
                $pdf->SetKeywords($metadata['keywords'], true);
            }

            return $pdf->Output('S');
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }
}
