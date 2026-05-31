<?php

namespace App\Services\Pdf;

use Spatie\Browsershot\Browsershot;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser as PdfParser;

class PdfToImageService
{
    /**
     * Convert PDF pages to images.
     *
     * @param string $filePath Path on the 'temp' disk
     * @param string $format 'jpg' or 'png'
     * @return array Array of image contents
     */
    public function convertPdfToImages(string $filePath, string $format = 'jpg'): array
    {
        $content = Storage::disk('temp')->get($filePath);
        $fullPath = Storage::disk('temp')->path($filePath);

        $tempDir = storage_path('app/temp/' . Str::random(10));
        mkdir($tempDir, 0777, true);

        try {
            // Get page count using Smalot Parser
            $parser = new PdfParser();
            $pdf = $parser->parseContent($content);
            $pages = $pdf->getPages();
            $pageCount = count($pages);

            $images = [];
            $extension = ($format === 'jpg' ? 'jpeg' : 'png');

            for ($i = 1; $i <= $pageCount; $i++) {
                $outputPath = $tempDir . "/page_{$i}." . ($format === 'jpg' ? 'jpg' : 'png');

                // We point Browsershot to the PDF and use fragment #page=N
                // Headless Chrome supports showing specific pages via URL fragments
                Browsershot::url('file://' . $fullPath . '#page=' . $i)
                    ->setScreenshotType($extension)
                    ->save($outputPath);

                if (file_exists($outputPath)) {
                    $images[] = file_get_contents($outputPath);
                }
            }

            return $images;
        } finally {
            $this->recursiveDelete($tempDir);
        }
    }

    private function recursiveDelete($dir) {
        if (!file_exists($dir)) return;
        $files = array_diff(scandir($dir), array('.', '..'));
        foreach ($files as $file) {
            (is_dir("$dir/$file")) ? $this->recursiveDelete("$dir/$file") : unlink("$dir/$file");
        }
        return rmdir($dir);
    }
}
