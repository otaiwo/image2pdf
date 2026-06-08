<?php

namespace Tests\Feature;

use App\Jobs\MergePdfJob;
use App\Models\ToolJob;
use App\Services\Pdf\MergePdfService;
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

        $file1 = $this->pdfUpload('doc1.pdf');
        $file2 = $this->pdfUpload('doc2.pdf');

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
        $file1 = $this->pdfUpload('doc1.pdf');

        $response = $this->postJson(route('api.tools.merge-pdf.upload'), [
            'files' => [$file1]
        ]);

        $response->assertStatus(422);
    }

    public function test_rejects_spoofed_pdf_uploads()
    {
        Storage::fake('temp');

        $file1 = $this->pdfUpload('doc1.pdf');
        $file2 = UploadedFile::fake()->createWithContent('spoofed.pdf', 'not a pdf');

        $response = $this->postJson(route('api.tools.merge-pdf.upload'), [
            'files' => [$file1, $file2]
        ]);

        $response->assertStatus(422);
    }

    public function test_merge_status_matches_frontend_contract()
    {
        $toolJob = ToolJob::create([
            'job_id' => '11111111-1111-1111-1111-111111111111',
            'type' => 'merge_pdf',
            'status' => 'pending',
            'input_files' => ['path/to/source.pdf'],
            'metadata' => ['filename' => 'merged-test.pdf'],
        ]);

        $response = $this->getJson(route('api.tools.merge-pdf.status', $toolJob->job_id));

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.job_id', $toolJob->job_id)
            ->assertJsonPath('data.filename', 'merged-test.pdf')
            ->assertJsonStructure([
                'data' => [
                    'job_id',
                    'status',
                    'progress',
                    'is_completed',
                    'is_expired',
                    'filename',
                    'created_at',
                    'updated_at',
                    'download_url',
                    'error',
                ],
            ]);
    }

    public function test_merge_job_stores_merged_pdf_content_without_watermarking()
    {
        Storage::fake('temp');

        ToolJob::create([
            'job_id' => 'merge-job',
            'type' => 'merge_pdf',
            'status' => 'pending',
            'input_files' => [
                'uploads/merge-job/source-1.pdf',
                'uploads/merge-job/source-2.pdf',
            ],
            'metadata' => [],
        ]);

        $mergeService = \Mockery::mock(MergePdfService::class);
        $mergeService
            ->shouldReceive('merge')
            ->once()
            ->with([
                'uploads/merge-job/source-1.pdf',
                'uploads/merge-job/source-2.pdf',
            ])
            ->andReturn('%PDF-1.4 merged content');

        (new MergePdfJob('merge-job'))->handle($mergeService);

        $toolJob = ToolJob::where('job_id', 'merge-job')->first();

        $this->assertSame('completed', $toolJob->status);
        Storage::disk('temp')->assertExists($toolJob->output_file);
        $this->assertSame(
            '%PDF-1.4 merged content',
            Storage::disk('temp')->get($toolJob->output_file)
        );
    }

    private function pdfUpload(string $name): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            $name,
            "%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        );
    }
}
