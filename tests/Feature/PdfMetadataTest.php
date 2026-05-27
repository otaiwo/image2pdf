<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PdfMetadataTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdf_for_metadata_edit()
    {
        Storage::fake('temp');
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.edit-metadata.upload'), [
            'file' => $file,
            'title' => 'New Title',
            'author' => 'New Author'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'data' => ['job_id', 'status']]);

        $jobId = $response->json('data.job_id');
        Storage::disk('temp')->assertExists("uploads/{$jobId}");
        
        $this->assertDatabaseHas('tool_jobs', [
            'job_id' => $jobId,
            'type' => 'edit_metadata'
        ]);
    }
}
