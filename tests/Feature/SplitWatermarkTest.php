<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SplitWatermarkTest extends TestCase
{
    use RefreshDatabase;

    protected $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 20>>stream\nBT /F1 12 Tf ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\n0000000188 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n258\n%%EOF";

    public function test_can_upload_pdf_for_splitting()
    {
        Storage::fake('temp');
        \Illuminate\Support\Facades\Bus::fake();
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $this->mock(\App\Services\Pdf\SplitPdfService::class, function ($mock) {
            $mock->shouldReceive('getPageCount')->andReturn(5);
        });

        $response = $this->postJson(route('api.tools.split-pdf.upload'), [
            'file' => $file,
            'pages' => '1'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);
    }

    public function test_can_upload_pdf_for_watermarking()
    {
        Storage::fake('temp');
        \Illuminate\Support\Facades\Bus::fake();
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.watermark-pdf.upload'), [
            'file' => $file,
            'text' => 'TEST WATERMARK'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);
    }

    public function test_dashboard_recent_activity()
    {
        \App\Models\ToolJob::create([
            'job_id' => 'test-job',
            'type' => 'merge_pdf',
            'status' => 'completed',
            'metadata' => ['original_filename' => 'test.pdf']
        ]);

        $response = $this->getJson(route('api.dashboard.recent-activity'));

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'data');
        $response->assertJsonFragment(['job_id' => 'test-job']);
    }
}
