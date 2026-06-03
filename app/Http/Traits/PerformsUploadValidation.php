<?php

namespace App\Http\Traits;

use App\Services\Pdf\FileUploadValidationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

trait PerformsUploadValidation
{
    /**
     * Validate file upload with uniform checks
     * 
     * This trait provides a centralized way to validate file uploads across
     * all tools, checking for images in PDFs and recommending OCR when needed.
     * 
     * @param UploadedFile $file The uploaded file
     * @param string $actionType The action type (e.g., 'extract_text', 'pdf_to_txt')
     * @param array $options Additional validation options
     * @return array Validation result
     */
    protected function validateUploadFile(
        UploadedFile $file,
        string $actionType,
        array $options = []
    ): array {
        /** @var FileUploadValidationService $validator */
        $validator = app(FileUploadValidationService::class);
        
        return $validator->validateUpload($file, $actionType, $options);
    }
    
    /**
     * Get validation response with detailed feedback
     * 
     * Can be used to return validation results to the frontend along with
     * the job ID and other response data.
     * 
     * @param array $validationResult The validation result from validateUploadFile()
     * @param string $jobId The job ID created for this upload
     * @param array $additionalData Any additional data to include in response
     * @return array Response data
     */
    protected function getValidationResponse(
        array $validationResult,
        string $jobId,
        array $additionalData = []
    ): array {
        return array_merge([
            'success' => true,
            'job_id' => $jobId,
            'data' => array_merge(['job_id' => $jobId], $additionalData),
            'validation' => [
                'passed' => $validationResult['validation_passed'] ?? true,
                'warnings' => $validationResult['warnings'] ?? [],
                'recommendations' => $validationResult['recommendations'] ?? [],
                'ocr_recommended' => $validationResult['ocr_recommended'] ?? false,
                'ocr_reason' => $validationResult['ocr_recommendation_reason'],
            ],
            'file_info' => [
                'name' => $validationResult['file_info']['name'] ?? null,
                'size' => $validationResult['file_info']['size'] ?? null,
                'extension' => $validationResult['file_info']['extension'] ?? null,
            ],
            'pdf_analysis' => $validationResult['pdf_analysis'] ?? null,
        ], $additionalData);
    }
}
