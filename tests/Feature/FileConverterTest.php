<?php

namespace Tests\Feature;

use App\Models\ToolJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FileConverterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('temp');
    }

    public function test_can_upload_file_for_pdf_to_txt_conversion()
    {
        $this->withoutExceptionHandling();
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.file-converter.upload'), [
            'type' => 'pdf_to_txt',
            'file' => $file,
        ]);

        $response->assertStatus(202)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'pending',
                ]
            ]);

        $this->assertDatabaseHas('tool_jobs', [
            'type' => 'pdf_to_txt',
            'status' => 'pending',
        ]);
    }

    public function test_can_upload_file_for_pdf_to_docx_conversion()
    {
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.file-converter.upload'), [
            'type' => 'pdf_to_docx',
            'file' => $file,
        ]);

        $response->assertStatus(202);
    }

    public function test_can_upload_excel_for_file_to_pdf_conversion()
    {
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('doc.xlsx', 100);

        $response = $this->postJson(route('api.tools.file-converter.upload'), [
            'type' => 'file_to_pdf',
            'file' => $file,
        ]);

        $response->assertStatus(202);
    }

    public function test_can_upload_file_for_file_to_pdf_conversion()
    {
        \Illuminate\Support\Facades\Bus::fake();

        $file = UploadedFile::fake()->create('test.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $response = $this->postJson(route('api.tools.file-converter.upload'), [
            'type' => 'file_to_pdf',
            'file' => $file,
        ]);

        $response->assertStatus(202);
    }

    public function test_fails_if_type_is_invalid()
    {
        $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');

        $response = $this->postJson(route('api.tools.file-converter.upload'), [
            'type' => 'invalid_type',
            'file' => $file,
        ]);

        $response->assertStatus(422);
    }
}
