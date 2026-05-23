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
        \Illuminate\Support\Facades\Bus::fake();

        $file1 = UploadedFile::fake()->create('doc1.pdf', 100, 'application/pdf');
        $file2 = UploadedFile::fake()->create('doc2.pdf', 100, 'application/pdf');

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
