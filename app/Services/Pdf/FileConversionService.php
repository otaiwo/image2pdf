<?php

namespace App\Services\Pdf;

use PhpOffice\PhpWord\IOFactory as WordIOFactory;
use PhpOffice\PhpWord\Settings;
use PhpOffice\PhpPresentation\IOFactory as PresIOFactory;
use Smalot\PdfParser\Parser as PdfParser;
use Spatie\LaravelPdf\Facades\Pdf;
use App\Services\Storage\TempFileService;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpSpreadsheet\IOFactory as SpreadIOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpPresentation\IOFactory as PresIOFactory;

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
        Log::info("Starting PDF conversion", ['filePath' => $filePath, 'extension' => $extension]);
        $content = $this->tempFileService->getFile($filePath);

        $tempPath = storage_path('app/temp/' . uniqid('conv_', true) . '.' . $extension);
        Storage::disk('temp')->put(basename($tempPath), $content);

        try {
            $pdfContent = match (strtolower($extension)) {
                'txt' => $this->convertTxtToPdf($content),
                'docx' => $this->convertDocxToPdf($tempPath),
                'doc' => $this->convertDocxToPdf($tempPath), // PHPWord handles both
                'pptx' => $this->convertPpptxToPdf($tempPath),
                'ppt' => $this->convertPpptxToPdf($tempPath),
                'xls' => $this->convertExcelToPdf($tempPath),
                'xlsx' => $this->convertExcelToPdf($tempPath),
                default => throw new \Exception("Unsupported format for PDF conversion: $extension"),
            };

            Log::info("PDF conversion successful", ['extension' => $extension]);
            return $pdfContent;
        } catch (\Exception $e) {
            Log::error("PDF conversion failed", [
                'extension' => $extension,
                'error' => $e->getMessage(),
                'file' => $filePath
            ]);
            throw $e;
        } finally {
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
            if (Storage::disk('temp')->exists(basename($tempPath))) {
                Storage::disk('temp')->delete(basename($tempPath));
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
        Log::info("Extracting text from PDF", ['filePath' => $filePath]);
        try {
            $content = $this->tempFileService->getFile($filePath);
            $parser = new PdfParser();
            $pdf = $parser->parseContent($content);
            $text = $pdf->getText();
            Log::info("Text extraction successful");
            return $text;
        } catch (\Exception $e) {
            Log::error("Text extraction failed", ['error' => $e->getMessage(), 'file' => $filePath]);
            throw $e;
        }
    }

    public function convertPdfToDocx(string $filePath): string
    {
        Log::info("Converting PDF to DOCX", ['filePath' => $filePath]);
        try {
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

            Log::info("PDF to DOCX conversion successful");
            return $content;
        } catch (\Exception $e) {
            Log::error("PDF to DOCX conversion failed", ['error' => $e->getMessage(), 'file' => $filePath]);
            throw $e;
        }
    }

    protected function convertExcelToPdf(string $path): string
    {
        $spreadsheet = SpreadIOFactory::load($path);
        $htmlWriter = SpreadIOFactory::createWriter($spreadsheet, 'Html');

        ob_start();
        $htmlWriter->save('php://output');
        $html = ob_get_clean();

        $pdf = Pdf::html($html)->format('a4')->orientation('landscape');
        return base64_decode($pdf->base64());
    }

    public function convertPdfToExcel(string $filePath): string
    {
        Log::info("Converting PDF to Excel (Basic Text Extraction)", ['filePath' => $filePath]);
        $text = $this->convertPdfToText($filePath);
        $lines = explode("\n", $text);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($lines as $row => $line) {
            // Attempt to split by multiple spaces or tabs
            $columns = preg_split('/\s{2,}|\t/', trim($line));
            foreach ($columns as $col => $value) {
                $sheet->setCellValueByColumnAndRow($col + 1, $row + 1, $value);
            }
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'xls');
        $writer = SpreadIOFactory::createWriter($spreadsheet, 'Xlsx');
        $writer->save($tempFile);

        $content = file_get_contents($tempFile);
        unlink($tempFile);
        return $content;
    }

    public function convertPdfToPptx(string $filePath): string
    {
        Log::info("Converting PDF to PPTX (Basic Text Extraction)", ['filePath' => $filePath]);
        $text = $this->convertPdfToText($filePath);
        $lines = explode("\n", $text);

        $presentation = new PhpPresentation();

        // Chunk lines into "slides"
        $chunks = array_chunk($lines, 10);
        foreach ($chunks as $index => $chunk) {
            $slide = ($index === 0) ? $presentation->getActiveSlide() : $presentation->createSlide();
            $shape = $slide->createRichTextShape();
            $shape->setHeight(300)->setWidth(600)->setOffsetX(50)->setOffsetY(50);
            $shape->createTextRun(implode("\n", $chunk));
        }

        $tempFile = tempnam(sys_get_temp_dir(), 'pptx');
        $writer = PresIOFactory::createWriter($presentation, 'PowerPoint2007');
        $writer->save($tempFile);

        $content = file_get_contents($tempFile);
        unlink($tempFile);
        return $content;
    }
}
