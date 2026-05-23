<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\ToolJob;

class ImageToPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_upload_images_and_start_conversion()
    {
        Storage::fake('temp');

        $response = $this->postJson(route('api.tools.image-to-pdf.upload'), [
            'images' => [
                UploadedFile::fake()->image('test1.jpg'),
                UploadedFile::fake()->image('test2.png'),
            ]
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
        $toolJob = ToolJob::create([
            'job_id' => 'test-job-id',
            'type' => 'image_to_pdf',
            'status' => 'pending',
            'input_files' => ['path/to/image.jpg'],
        ]);

        $response = $this->getJson(route('api.tools.image-to-pdf.status', 'test-job-id'));

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'job_id' => 'test-job-id',
                    'status' => 'pending',
                ]
            ]);
    }
}
