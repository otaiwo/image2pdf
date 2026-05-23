<?php

namespace App\Services\Pdf;

use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpPresentation\IOFactory as PresIOFactory;
use Smalot\PdfParser\Parser as PdfParser;
use Spatie\LaravelPdf\Facades\Pdf;
use App\Services\Storage\TempFileService;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpPresentation\PhpPresentation;

class FileConversionService
{
    protected $tempFileService;

    public function __construct(TempFileService $tempFileService)
    {
        $this->tempFileService = $tempFileService;
        // Set PHPWord to use a temporary directory for fragments
        Settings::setZipClass(Settings::PCLZIP);
    }

    public function convertToPdf(string $filePath, string $extension): string
    {
        $content = $this->tempFileService->getFile($filePath);

        // Use a real temporary file instead of manually building a path in storage
        $tempPath = tempnam(sys_get_temp_dir(), 'conv');
        file_put_contents($tempPath, $content);

        try {
            switch (strtolower($extension)) {
                case 'txt':
                    return $this->convertTxtToPdf($content);
                case 'docx':
                    return $this->convertDocxToPdf($tempPath);
                case 'pptx':
                    return $this->convertPpptxToPdf($tempPath);
                default:
                    throw new \Exception("Unsupported format for PDF conversion: $extension");
            }
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }

    protected function convertTxtToPdf(string $content): string
    {
        $pdf = Pdf::view('pdf.text-to-pdf', ['content' => $content])
            ->format('a4');

        return base64_decode($pdf->base64());
    }

    protected function convertDocxToPdf(string $path): string
    {
        $phpWord = WordIOFactory::load($path);
        $htmlWriter = WordIOFactory::createWriter($phpWord, 'HTML');

        ob_start();
        $htmlWriter->save('php://output');
        $html = ob_get_clean();

        $pdf = Pdf::html($html)->format('a4');
        return base64_decode($pdf->base64());
    }

    protected function convertPpptxToPdf(string $path): string
    {
        $presentation = PresIOFactory::load($path);
        $slides = $presentation->getAllSlides();
        $html = '<style>
            body { font-family: sans-serif; }
            .slide {
                page-break-after: always;
                border: 1px solid #ccc;
                padding: 40px;
                margin-bottom: 20px;
                min-height: 600px;
            }
            .slide-number { color: #888; font-size: 0.8em; }
        </style>';

        foreach ($slides as $index => $slide) {
            $html .= '<div class="slide">';
            $html .= '<div class="slide-number">Slide ' . ($index + 1) . '</div>';

            foreach ($slide->getShapeCollection() as $shape) {
                if ($shape instanceof \PhpOffice\PhpPresentation\Shape\RichText) {
                    $html .= '<div>' . nl2br(htmlspecialchars($shape->getPlainText())) . '</div>';
                }
            }
            $html .= '</div>';
        }

        $pdf = Pdf::html($html)->format('a4')->orientation('landscape');
        return base64_decode($pdf->base64());
    }

    public function convertPdfToText(string $filePath): string
    {
        $content = $this->tempFileService->getFile($filePath);
        $parser = new PdfParser();
        $pdf = $parser->parseContent($content);
        return $pdf->getText();
    }

    public function convertPdfToDocx(string $filePath): string
    {
        $text = $this->convertPdfToText($filePath);

        $phpWord = new PhpWord();
        $section = $phpWord->addSection();

        // Split text by lines and add to Word
        $lines = explode("\n", $text);
        foreach ($lines as $line) {
            $section->addText(htmlspecialchars($line));
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'docx');
        $objWriter = WordIOFactory::createWriter($phpWord, 'Word2007');
        $objWriter->save($tempFile);

        $content = file_get_contents($tempFile);
        unlink($tempFile);

        return $content;
    }
}
