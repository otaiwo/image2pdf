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
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

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
        \Illuminate\Support\Facades\Bus::fake();
        \Illuminate\Support\Facades\Cache::flush();

        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

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
