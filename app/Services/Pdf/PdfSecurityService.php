<?php

namespace App\Services\Pdf;

use setasign\FpdiProtection\FpdiProtection;
use Illuminate\Support\Facades\Storage;

class PdfSecurityService
{
    /**
     * Protect a PDF with a password.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $password The user password
     * @param array $permissions Array of allowed actions (print, modify, copy, etc.)
     * @return string Protected PDF content
     */
    public function protect(string $filePath, string $password, array $permissions = []): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_sec');
        file_put_contents($tempFile, $content);

        $pdf = new FpdiProtection();

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            // Set protection (user_password, owner_password, permissions)
            // permissions: print, modify, copy, annot-forms
            $pdf->setProtection($permissions, $password, null);

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
