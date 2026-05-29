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
     * @param array $options Security options (allow_printing, allow_copying, etc.)
     * @return string Protected PDF content
     */
    public function protect(string $filePath, string $password, array $options = []): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_sec');
        file_put_contents($tempFile, $content);

        $pdf = new FpdiProtection('P', 'mm', 'A4', true);

        try {
            $pageCount = $pdf->setSourceFile($tempFile);

            // Map options to FpdiProtection permissions
            $permissions = [];

            if ($options['allow_printing'] ?? false) {
                $permissions[] = FpdiProtection::PERM_PRINT;
                $permissions[] = FpdiProtection::PERM_DIGITAL_PRINT;
            }

            if ($options['allow_copying'] ?? false) {
                $permissions[] = FpdiProtection::PERM_COPY;
                $permissions[] = FpdiProtection::PERM_ACCESSIBILITY;
            }

            if ($options['allow_editing'] ?? false) {
                $permissions[] = FpdiProtection::PERM_MODIFY;
            }

            if ($options['allow_annotating'] ?? false) {
                $permissions[] = FpdiProtection::PERM_ANNOT;
                $permissions[] = FpdiProtection::PERM_FILL_FORM;
            }

            if ($options['allow_extracting'] ?? false) {
                $permissions[] = FpdiProtection::PERM_ASSEMBLE;
            }

            // Set protection (user_password, owner_password, permissions)
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
