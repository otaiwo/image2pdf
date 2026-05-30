<?php

namespace Tests\Unit\Services\Pdf;

use App\Services\Pdf\PdfSecurityService;
use App\Services\Pdf\UnlockPdfService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use setasign\Fpdi\Fpdi;

class PdfEncryptionTest extends TestCase
{
    public function test_security_service_can_protect_pdf()
    {
        Storage::fake('temp');
        
        // Create a simple PDF
        $pdf = new Fpdi();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(40, 10, 'Hello World!');
        $content = $pdf->Output('S');
        
        Storage::disk('temp')->put('test.pdf', $content);
        
        $service = new PdfSecurityService();
        
        try {
            $protectedContent = $service->protect('test.pdf', 'password123');
            $this->assertNotEmpty($protectedContent);
            $this->assertNotEquals($content, $protectedContent);
        } catch (\RuntimeException $e) {
            $this->fail("PdfSecurityService failed: " . $e->getMessage());
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_protect_and_output_pdf()
    {
        Storage::fake('temp');
        
        $pdf = new Fpdi();
        $pdf->AddPage();
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(40, 10, 'Hello World!');
        $originalContent = $pdf->Output('S');
        
        Storage::disk('temp')->put('original.pdf', $originalContent);
        
        $service = new PdfSecurityService();
        $protectedContent = $service->protect('original.pdf', 'password123');
        
        $this->assertNotEmpty($protectedContent);
        $this->assertStringContainsString('/Encrypt', $protectedContent);
    }
}
