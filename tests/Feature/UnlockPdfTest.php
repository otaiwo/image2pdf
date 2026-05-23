<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UnlockPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_pdf_for_unlocking()
    {
        Storage::fake('temp');
        Bus::fake();

        $file = UploadedFile::fake()->create('locked.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.unlock-pdf.upload'), [
            'file' => $file,
            'password' => 'secret123'
        ]);

        $response->assertStatus(202);
        $response->assertJsonStructure(['success', 'job_id', 'status']);
    }

    public function test_unlock_requires_password()
    {
        $file = UploadedFile::fake()->create('locked.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.unlock-pdf.upload'), [
            'file' => $file
        ]);

        $response->assertStatus(422);
    }
}
