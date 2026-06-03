# Quick Implementation Reference for Upload Validation

Copy-paste snippets for quickly adding validation to existing controllers.

## PDF Chat Upload (PdfChatController)

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
        
        // ADD THIS: Validation
        $validationResult = $this->validateUploadFile(
            $file,
            FileUploadValidationService::ACTION_CHAT
        );

        $jobId = Str::uuid()->toString();
        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        $parser = new Parser();
        $pdf = $parser->parseFile($file->getRealPath());
        $text = $pdf->getText();

        // ADD THIS: Store validation in metadata
        $metadata = [
            'validation_result' => $validationResult,
            'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
            'text_preview' => substr($text, 0, 500),
        ];

        ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'chat_pdf',
            'status' => 'ready',
            'input_files' => [$path],
            'metadata' => $metadata,
        ]);

        // REPLACE: Return statement to include validation
        return response()->json(
            $this->getValidationResponse($validationResult, $jobId, [
                'status' => 'ready',
            ]),
            202
        );
    }
}
```

## Protect PDF Upload (ProtectPdfController)

```php
use App\Http\Traits\PerformsUploadValidation;
use App\Services\Pdf\FileUploadValidationService;

class ProtectPdfController extends Controller
{
    use PerformsUploadValidation;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:1',
            'files.*' => 'required|file|mimes:pdf|max:20480',
            // ... other validations
        ]);

        // For each file, validate it
        $files = $request->file('files');
        $validationResults = [];
        
        foreach ($files as $index => $file) {
            $validationResult = $this->validateUploadFile(
                $file,
                FileUploadValidationService::ACTION_PROTECT_PDF
            );
            $validationResults[] = $validationResult;
        }

        // Create job...
        $jobId = Str::uuid()->toString();
        
        // Use first file's validation for main response
        return response()->json(
            $this->getValidationResponse($validationResults[0], $jobId, [
                'status' => 'pending',
                'files_count' => count($files),
            ]),
            202
        );
    }
}
```

## Merge PDF Upload (MergePdfController)

```php
use App\Http\Traits\PerformsUploadValidation;
use App\Services\Pdf\FileUploadValidationService;

class MergePdfController extends Controller
{
    use PerformsUploadValidation;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'files' => 'required|array|min:2',
            'files.*' => 'required|file|mimes:pdf|max:20480',
        ]);

        $jobId = Str::uuid()->toString();
        $files = $request->file('files');
        $uploadedPaths = [];
        
        // Validate first file (they should all be same type)
        $firstValidation = $this->validateUploadFile(
            $files[0],
            FileUploadValidationService::ACTION_MERGE_PDF
        );

        foreach ($files as $file) {
            $filename = Str::random(40) . '.pdf';
            $path = "uploads/{$jobId}/{$filename}";
            Storage::disk('temp')->put($path, file_get_contents($file));
            $uploadedPaths[] = $path;
        }

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'merge_pdf',
            'status' => 'pending',
            'input_files' => $uploadedPaths,
            'metadata' => [
                'validation_result' => $firstValidation,
                'file_count' => count($files),
            ],
        ]);

        MergePdfJob::dispatch($jobId);

        return response()->json(
            $this->getValidationResponse($firstValidation, $jobId, [
                'status' => 'pending',
                'files_merged' => count($files),
            ]),
            202
        );
    }
}
```

## Split PDF Upload (SplitPdfController)

```php
use App\Http\Traits\PerformsUploadValidation;
use App\Services\Pdf\FileUploadValidationService;

class SplitPdfController extends Controller
{
    use PerformsUploadValidation;

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:20480',
            'pages' => 'required|string',
        ]);

        $file = $request->file('file');
        
        $validationResult = $this->validateUploadFile(
            $file,
            FileUploadValidationService::ACTION_SPLIT_PDF
        );

        $jobId = Str::uuid()->toString();
        $filename = Str::random(40) . '.pdf';
        $path = "uploads/{$jobId}/{$filename}";
        Storage::disk('temp')->put($path, file_get_contents($file));

        $toolJob = ToolJob::create([
            'job_id' => $jobId,
            'user_id' => $request->user()?->id,
            'type' => 'split_pdf',
            'status' => 'pending',
            'input_files' => [$path],
            'metadata' => [
                'pages' => $request->input('pages'),
                'validation_result' => $validationResult,
            ],
        ]);

        SplitPdfJob::dispatch($jobId);

        return response()->json(
            $this->getValidationResponse($validationResult, $jobId, [
                'status' => 'pending',
            ]),
            202
        );
    }
}
```

## Extract Keywords/Summarize (AI Tools)

```php
use App\Http\Traits\PerformsUploadValidation;
use App\Services\Pdf\FileUploadValidationService;

// For keyword extraction
$actionType = FileUploadValidationService::ACTION_EXTRACT_KEYWORDS;

// For summarization
$actionType = FileUploadValidationService::ACTION_SUMMARIZE;

// For translation
$actionType = FileUploadValidationService::ACTION_TRANSLATE;

// Usage:
$validationResult = $this->validateUploadFile($file, $actionType);
```

## General Pattern

For every upload controller, follow this pattern:

```php
// 1. Add trait at class level
use PerformsUploadValidation;

// 2. In upload method, after file validation:
$file = $request->file('file');

// 3. Determine action type
$actionType = FileUploadValidationService::ACTION_*;

// 4. Validate
$validationResult = $this->validateUploadFile($file, $actionType);

// 5. Create job with validation in metadata
$metadata = [
    'validation_result' => $validationResult,
    'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
    // ... other metadata
];

// 6. Return response with validation
return response()->json(
    $this->getValidationResponse($validationResult, $jobId, [
        'status' => 'pending',
        // ... other response fields
    ]),
    202
);
```

## Important Note

When updating controllers that handle **multiple files** (like merge, protect):
- Validate the **first file** and use that validation result for the response
- All files are typically the same type, so validation applies to all
- Store the validation result in metadata for logging

When updating controllers for **text operations** (chat, extract keywords, summarize, translate):
- These actions benefit most from OCR recommendations
- If `ocr_recommended` is true, users should be prompted to run OCR first
- The validation service will detect image-heavy PDFs automatically

## Testing Changes

After updating a controller, test with:

1. **Normal PDF** - No OCR recommendation
2. **Image-heavy PDF** - Should recommend OCR
3. **Scanned PDF** - Should recommend OCR for text operations
4. **Large file** - Should show size warning

Curl example:
```bash
curl -X POST http://localhost/api/tools/chat/upload \
  -F "file=@document.pdf" \
  | jq '.validation'
```

Expected response with validation data:
```json
{
  "validation": {
    "passed": true,
    "ocr_recommended": true,
    "ocr_reason": "PDF contains images but lacks extractable text content",
    "recommendations": [...]
  }
}
```
