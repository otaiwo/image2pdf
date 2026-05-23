<?php

namespace App\Services\Pdf;

use setasign\FpdiProtection\FpdiProtection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UnlockPdfService
{
    /**
     * Unlock a password-protected PDF.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $password The user password to unlock the PDF
     * @return string Unlocked PDF content
     */
    public function unlock(string $filePath, string $password): string
    {
        Log::info("Unlocking PDF", ['filePath' => $filePath]);

        $content = Storage::disk('temp')->get($filePath);
        $tempFile = tempnam(sys_get_temp_dir(), 'pdf_unlock');
        file_put_contents($tempFile, $content);

        $pdf = new FpdiProtection();

        try {
            // Attempt to set the source file with the password
            $pageCount = $pdf->setSourceFile($tempFile, $password);

            for ($i = 1; $i <= $pageCount; $i++) {
                $templateId = $pdf->importPage($i);
                $size = $pdf->getTemplateSize($templateId);

                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId);
            }

            return $pdf->Output('S');
        } catch (\Exception $e) {
            Log::error("Failed to unlock PDF", ['error' => $e->getMessage()]);
            throw new \Exception("Invalid password or unsupported PDF protection.");
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }
}
