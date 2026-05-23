<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PdfAiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdf_for_summarization()
    {
        Storage::fake('temp');

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 20>>stream\nBT /F1 12 Tf ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\n0000000188 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n258\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('doc.pdf', $pdfContent);

        $response = $this->postJson(route('api.tools.ai.summarize'), [
            'file' => $file
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);

        $jobId = $response->json('job_id');
        Storage::disk('temp')->assertExists("uploads/{$jobId}");
    }

    public function test_guest_limit_middleware()
    {
        Storage::fake('temp');
        \Illuminate\Support\Facades\Cache::flush();

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 20>>stream\nBT /F1 12 Tf ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\n0000000188 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n258\n%%EOF";
        $file = UploadedFile::fake()->createWithContent('doc.pdf', $pdfContent);

        // First 5 should pass
        for ($i = 0; $i < 5; $i++) {
            $this->postJson(route('api.tools.ai.summarize'), ['file' => $file])
                ->assertStatus(202);
        }

        // 6th should fail
        $this->postJson(route('api.tools.ai.summarize'), ['file' => $file])
            ->assertStatus(429)
            ->assertJson(['code' => 'GUEST_LIMIT_REACHED']);
    }
}
