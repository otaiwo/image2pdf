<?php

namespace Tests\Feature;

use App\Jobs\UnlockPdfJob;
use App\Models\ToolJob;
use App\Services\Pdf\UnlockPdfService;
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

    public function test_unlock_job_stores_unlocked_pdf_content_without_watermarking()
    {
        Storage::fake('temp');

        ToolJob::create([
            'job_id' => 'unlock-job',
            'type' => 'unlock_pdf',
            'status' => 'pending',
            'input_files' => ['uploads/unlock-job/source.pdf'],
            'metadata' => ['password' => 'secret123'],
        ]);

        $unlockService = \Mockery::mock(UnlockPdfService::class);
        $unlockService
            ->shouldReceive('unlock')
            ->once()
            ->with('uploads/unlock-job/source.pdf', 'secret123')
            ->andReturn('%PDF-1.4 unlocked content');

        (new UnlockPdfJob('unlock-job'))->handle($unlockService);

        $toolJob = ToolJob::where('job_id', 'unlock-job')->first();

        $this->assertSame('completed', $toolJob->status);
        $this->assertArrayNotHasKey('password', $toolJob->metadata);
        Storage::disk('temp')->assertExists($toolJob->output_file);
        $this->assertSame(
            '%PDF-1.4 unlocked content',
            Storage::disk('temp')->get($toolJob->output_file)
        );
    }
}
