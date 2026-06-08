<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\ToolJob;

class ImageToPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_images_and_start_conversion()
    {
        Storage::fake('temp');
        Bus::fake();

        $response = $this->postJson(route('api.tools.image-to-pdf.upload'), [
            'images' => [
                UploadedFile::fake()->image('test1.jpg'),
                UploadedFile::fake()->image('test2.png'),
            ],
            'options' => [
                'orientation' => 'portrait',
                'pageSize' => 'A4',
                'margin' => 'none',
                'mergeAll' => true,
            ],
        ]);

        $response->assertStatus(202)
            ->assertJsonStructure([
                'success',
                'job_id',
                'status',
                'check_status_url',
                'download_url',
            ]);

        $jobId = $response->json('job_id');
        $this->assertDatabaseHas('tool_jobs', [
            'job_id' => $jobId,
        ]);
    }

    public function test_can_check_job_status()
    {
        $jobId = '11111111-1111-1111-1111-111111111111';

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'type' => 'image_to_pdf',
            'status' => 'pending',
            'input_files' => ['path/to/image.jpg'],
        ]);

        $response = $this->getJson(route('api.tools.image-to-pdf.status', $jobId));

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.job_id', $jobId)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonStructure([
                'data' => [
                    'job_id',
                    'status',
                    'progress',
                    'created_at',
                    'updated_at',
                    'is_expired',
                    'is_completed',
                    'filename',
                    'download_url',
                    'error',
                ],
            ]);
    }
}
