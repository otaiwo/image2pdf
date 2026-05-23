<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MergePdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdfs_for_merging()
    {
        Storage::fake('temp');

        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj\n4 0 obj<</Length 20>>stream\nBT /F1 12 Tf ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\n0000000188 00000 n\ntrailer<</Size 5/Root 1 0 R>>\nstartxref\n258\n%%EOF";

        $file1 = UploadedFile::fake()->createWithContent('doc1.pdf', $pdfContent);
        $file2 = UploadedFile::fake()->createWithContent('doc2.pdf', $pdfContent);

        $response = $this->postJson(route('api.tools.merge-pdf.upload'), [
            'files' => [$file1, $file2]
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);

        $jobId = $response->json('job_id');
        Storage::disk('temp')->assertExists("uploads/{$jobId}");
    }

    public function test_requires_at_least_two_files_for_merging()
    {
        $file1 = UploadedFile::fake()->create('doc1.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.merge-pdf.upload'), [
            'files' => [$file1]
        ]);

        $response->assertStatus(422);
    }
}
