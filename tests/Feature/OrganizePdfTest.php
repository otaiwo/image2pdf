<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrganizePdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdf_for_organization()
    {
        Storage::fake('temp');
        Bus::fake();

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.organize-pdf.upload'), [
            'file' => $file,
            'pages_to_remove' => '2,4'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);
    }

    public function test_requires_pages_to_remove()
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.organize-pdf.upload'), [
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }
}
