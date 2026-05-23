<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProtectPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdf_for_protection()
    {
        Storage::fake('temp');
        Bus::fake();

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.protect-pdf.upload'), [
            'file' => $file,
            'password' => 'secret123'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);
    }

    public function test_requires_minimum_password_length()
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.protect-pdf.upload'), [
            'file' => $file,
            'password' => '123'
        ]);

        $response->assertStatus(422);
    }
}
