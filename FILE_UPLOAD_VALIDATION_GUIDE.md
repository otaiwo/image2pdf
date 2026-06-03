# File Upload Validation System - Implementation Guide

## Overview

A uniform file upload validation system has been implemented that automatically:
1. **Detects images in PDFs** - Identifies if a PDF contains images and extracts image details
2. **Checks user action** - Understands what the user is trying to do with the file
3. **Analyzes text content** - Determines if the PDF has extractable searchable text
4. **Recommends OCR** - Intelligently suggests OCR processing when needed for text-based operations

## Components

### 1. PdfImageDetectionService
**Location:** `app/Services/Pdf/PdfImageDetectionService.php`

Analyzes PDF content and detects images:
- `detectImages($filePath)` - Detects all images in the PDF
- `analyzeTextContent($filePath)` - Analyzes extractable text

```php
$imageDetectionService = app(PdfImageDetectionService::class);
$result = $imageDetectionService->detectImages($filePath);
// Returns:
// {
//   "success": true,
//   "has_images": true,
//   "total_images": 5,
//   "pages_with_images": 3,
//   "percentage_pages_with_images": 60,
//   "image_details": [...]
// }
```

### 2. FileUploadValidationService
**Location:** `app/Services/Pdf/FileUploadValidationService.php`

Main validation service that coordinates validation and recommendations:

```php
$validator = app(FileUploadValidationService::class);
$result = $validator->validateUpload($file, $actionType, $options);
// Returns comprehensive validation results including OCR recommendations
```

**Supported Action Types:**
- Text extraction: `extract_text`, `pdf_to_txt`, `pdf_to_docx`, `pdf_to_xlsx`, `pdf_to_pptx`, `extract_keywords`, `translate`, `summarize`, `chat`
- PDF operations: `merge_pdf`, `split_pdf`, `compress_pdf`, `protect_pdf`, `sign_pdf`, `watermark_pdf`, `unlock_pdf`, `organize_pdf`, `add_page_numbers`
- Conversions: `file_to_pdf`, `pdf_to_image`

### 3. PerformsUploadValidation Trait
**Location:** `app/Http/Traits/PerformsUploadValidation.php`

Use this trait in your controllers for easy integration:

```php
use App\Http\Traits\PerformsUploadValidation;

class YourController extends Controller
{
    use PerformsUploadValidation;
    
    // Now you can use:
    $validationResult = $this->validateUploadFile($file, $actionType);
    $response = $this->getValidationResponse($validationResult, $jobId);
}
```

## Implementation in Controllers

### Step 1: Add the trait to your controller

```php
use App\Http\Traits\PerformsUploadValidation;

class YourUploadController extends Controller
{
    use PerformsUploadValidation;
}
```

### Step 2: Import FileUploadValidationService constants

```php
use App\Services\Pdf\FileUploadValidationService;
```

### Step 3: Call validation in your upload method

```php
public function upload(Request $request): JsonResponse
{
    // ... your existing validation code ...
    
    $file = $request->file('file');
    
    // Determine the action type (e.g., 'pdf_to_txt')
    $actionType = FileUploadValidationService::ACTION_CONVERT_TO_TEXT;
    
    // Perform uniform validation
    $validationResult = $this->validateUploadFile($file, $actionType);
    
    // ... create job and store file ...
    
    // Store validation results in metadata
    $toolJob = ToolJob::create([
        'job_id' => $jobId,
        'type' => 'your_tool_type',
        'metadata' => [
            'validation_result' => $validationResult,
            'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
        ],
    ]);
    
    // Return validation results in response
    return response()->json(
        $this->getValidationResponse($validationResult, $jobId, [
            'status' => 'pending',
            'check_status_url' => route('api.your.status', $jobId),
        ]),
        202
    );
}
```

## Response Format

When using `getValidationResponse()`, the response includes:

```json
{
  "success": true,
  "job_id": "uuid",
  "status": "pending",
  "check_status_url": "...",
  "validation": {
    "passed": true,
    "warnings": [],
    "recommendations": [
      "We recommend running OCR (Optical Character Recognition) on this PDF before converting to text. Your PDF contains scanned images. OCR will extract text from images, making the content searchable and more usable for text operations."
    ],
    "ocr_recommended": true,
    "ocr_reason": "PDF contains images but lacks extractable text content"
  },
  "file_info": {
    "name": "document.pdf",
    "size": 2048576,
    "extension": "pdf"
  },
  "pdf_analysis": {
    "image_detection": {
      "has_images": true,
      "total_images": 3,
      "pages_with_images": 2,
      "percentage_pages_with_images": 66.67
    },
    "text_analysis": {
      "has_extractable_text": false,
      "pages_with_text": 0
    }
  }
}
```

## OCR Recommendation Logic

OCR is recommended when:

1. **PDF has images but no extractable text** - And user is performing text operations (extract, convert to text/docx/xlsx, etc.)
2. **PDF is primarily image-based** - When >50% of pages contain images and user wants to extract text
3. **Very image-heavy PDFs** - When >70% of pages contain images, even if some text is present

## Example Controller Implementation

Here's a complete example for the PdfChatController:

```php
<?php

namespace App\Http\Controllers\Api\Tools;

use App\Http\Controllers\Controller;
use App\Http\Traits\PerformsUploadValidation;
use App\Models\ToolJob;
use App\Services\AI\PdfChatService;
use App\Services\Pdf\FileUploadValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Smalot\PdfParser\Parser;

class PdfChatController extends Controller
{
    use PerformsUploadValidation;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $file = $request->file('file');
        
        // Perform uniform upload validation
        $validationResult = $this->validateUploadFile(
            $file,
            FileUploadValidationService::ACTION_CHAT
        );

        $jobId = Str::uuid()->toString();

        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        // Extract text immediately for chat readiness
        $parser = new Parser();
        $pdf = $parser->parseFile($file->getRealPath());
        $text = $pdf->getText();

        // Store validation results
        $metadata = [
            'validation_result' => $validationResult,
            'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
        ];

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'chat_pdf',
            'status' => 'ready',
            'input_files' => [$path],
            'metadata' => $metadata + [
                'text_preview' => substr($text, 0, 500),
                'has_extractable_text' => strlen($text) > 100,
            ],
        ]);

        return response()->json(
            $this->getValidationResponse($validationResult, $jobId, [
                'status' => 'ready',
                'message' => 'PDF analyzed. You can now ask questions.',
            ]),
            202
        );
    }
}
```

## Integration Checklist

For each tool controller that handles file uploads:

- [ ] Add `use PerformsUploadValidation;` trait
- [ ] Import `FileUploadValidationService`
- [ ] Determine the appropriate `ACTION_*` constant for your operation
- [ ] Call `$this->validateUploadFile($file, $actionType)` after file validation
- [ ] Store `validation_result` in ToolJob metadata
- [ ] Use `$this->getValidationResponse()` to format the response
- [ ] Update frontend to display validation recommendations to users

## Frontend Integration

The API response now includes validation recommendations. Update your frontend to:

1. **Display OCR recommendations** when `ocr_recommended` is true
2. **Show warnings** from the `validation.warnings` array
3. **Display helpful info** from `validation.recommendations`
4. **Offer OCR as an option** if recommended

Example React component handling:

```tsx
const response = await api.uploadFile(file);

if (response.validation?.ocr_recommended) {
  toast.warning(response.validation.ocr_reason);
  // Show OCR offer
}

if (response.validation?.recommendations.length > 0) {
  response.validation.recommendations.forEach(rec => {
    toast.info(rec.message || rec);
  });
}
```

## Testing

To test the validation system:

```php
// Test with an image-heavy PDF
$file = UploadedFile::fake()->create('document.pdf', 5000);
$validator = app(FileUploadValidationService::class);
$result = $validator->validateUpload(
    $file,
    FileUploadValidationService::ACTION_EXTRACT_KEYWORDS
);

dd($result);
```

## Logging

All validations are logged to storage/logs with the following information:
- PDF image detection results
- Text analysis results
- OCR recommendations

Monitor logs with:
```bash
tail -f storage/logs/laravel-*.log | grep "validation\|detection"
```

## Service Provider Registration

The services are auto-registered in `AppServiceProvider`:

```php
$this->app->singleton(PdfImageDetectionService::class, function ($app) {
    return new PdfImageDetectionService();
});

$this->app->singleton(FileUploadValidationService::class, function ($app) {
    return new FileUploadValidationService(
        $app->make(PdfImageDetectionService::class)
    );
});
```

No additional configuration needed!
