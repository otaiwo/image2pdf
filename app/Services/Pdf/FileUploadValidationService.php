<?php

namespace App\Services\Pdf;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class FileUploadValidationService
{
    protected $imageDetectionService;
    
    // Action type constants
    const ACTION_EXTRACT_TEXT = 'extract_text';
    const ACTION_CONVERT_TO_TEXT = 'pdf_to_txt';
    const ACTION_CONVERT_TO_DOCX = 'pdf_to_docx';
    const ACTION_CONVERT_TO_XLSX = 'pdf_to_xlsx';
    const ACTION_CONVERT_TO_PPTX = 'pdf_to_pptx';
    const ACTION_EXTRACT_KEYWORDS = 'extract_keywords';
    const ACTION_TRANSLATE = 'translate';
    const ACTION_SUMMARIZE = 'summarize';
    const ACTION_CHAT = 'chat';
    const ACTION_FILE_TO_PDF = 'file_to_pdf';
    const ACTION_MERGE_PDF = 'merge_pdf';
    const ACTION_SPLIT_PDF = 'split_pdf';
    const ACTION_COMPRESS_PDF = 'compress_pdf';
    const ACTION_PROTECT_PDF = 'protect_pdf';
    const ACTION_SIGN_PDF = 'sign_pdf';
    const ACTION_WATERMARK_PDF = 'watermark_pdf';
    const ACTION_UNLOCK_PDF = 'unlock_pdf';
    const ACTION_ORGANIZE_PDF = 'organize_pdf';
    const ACTION_ADD_PAGE_NUMBERS = 'add_page_numbers';
    const ACTION_PDF_TO_IMAGE = 'pdf_to_image';
    
    public function __construct(PdfImageDetectionService $imageDetectionService)
    {
        $this->imageDetectionService = $imageDetectionService;
    }
    
    /**
     * Perform uniform upload validation and get recommendations
     * 
     * @param UploadedFile $file The uploaded file
     * @param string $actionType The action the user wants to perform
     * @param array $options Additional options for the action
     * @return array Validation result with recommendations
     */
    public function validateUpload(UploadedFile $file, string $actionType, array $options = []): array
    {
        $result = [
            'success' => true,
            'action_type' => $actionType,
            'file_info' => [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'extension' => strtolower($file->getClientOriginalExtension()),
            ],
            'validation_passed' => true,
            'warnings' => [],
            'recommendations' => [],
            'ocr_recommended' => false,
            'ocr_recommendation_reason' => null,
        ];
        
        // Only perform image detection for PDF files
        if ($result['file_info']['extension'] === 'pdf') {
            $result['pdf_analysis'] = $this->analyzePdf($file, $actionType);
            
            // Check if OCR is needed based on analysis
            $ocrRecommendation = $this->recommendOcr(
                $result['pdf_analysis'],
                $actionType
            );
            
            $result['ocr_recommended'] = $ocrRecommendation['recommended'];
            $result['ocr_recommendation_reason'] = $ocrRecommendation['reason'];
            
            if ($ocrRecommendation['recommended']) {
                $result['recommendations'][] = $ocrRecommendation['recommendation'];
            }
        }
        
        // Add action-specific recommendations
        $actionRecommendations = $this->getActionSpecificRecommendations(
            $actionType,
            $result['file_info'] ?? []
        );
        
        if (!empty($actionRecommendations)) {
            $result['recommendations'] = array_merge(
                $result['recommendations'],
                $actionRecommendations
            );
        }
        
        Log::info('File upload validation completed', [
            'action' => $actionType,
            'file' => $result['file_info']['name'],
            'ocr_recommended' => $result['ocr_recommended'],
            'recommendations_count' => count($result['recommendations']),
        ]);
        
        return $result;
    }
    
    /**
     * Analyze PDF for image content and text extraction capability
     * 
     * @param UploadedFile $file The PDF file
     * @param string $actionType The action to perform
     * @return array PDF analysis results
     */
    protected function analyzePdf(UploadedFile $file, string $actionType): array
    {
        $filePath = $file->getRealPath();
        
        // Detect images
        $imageDetection = $this->imageDetectionService->detectImages($filePath);
        
        // Analyze text content
        $textAnalysis = $this->imageDetectionService->analyzeTextContent($filePath);
        
        return [
            'image_detection' => $imageDetection,
            'text_analysis' => $textAnalysis,
            'detected_at' => now()->toIso8601String(),
        ];
    }
    
    /**
     * Determine if OCR is recommended based on PDF analysis and action
     * 
     * @param array $pdfAnalysis PDF analysis results
     * @param string $actionType The action to perform
     * @return array Recommendation with reason
     */
    protected function recommendOcr(array $pdfAnalysis, string $actionType): array
    {
        $imageDetection = $pdfAnalysis['image_detection'] ?? [];
        $textAnalysis = $pdfAnalysis['text_analysis'] ?? [];
        
        $hasImages = $imageDetection['has_images'] ?? false;
        $hasExtractableText = $textAnalysis['has_extractable_text'] ?? false;
        $isImageHeavy = ($imageDetection['percentage_pages_with_images'] ?? 0) > 50;
        
        // Actions that benefit from OCR
        $textExtractionActions = [
            self::ACTION_EXTRACT_TEXT,
            self::ACTION_CONVERT_TO_TEXT,
            self::ACTION_CONVERT_TO_DOCX,
            self::ACTION_CONVERT_TO_XLSX,
            self::ACTION_CONVERT_TO_PPTX,
            self::ACTION_EXTRACT_KEYWORDS,
            self::ACTION_TRANSLATE,
            self::ACTION_SUMMARIZE,
            self::ACTION_CHAT,
        ];
        
        // Determine if OCR is needed
        $needsOcr = false;
        $reason = null;
        
        if (in_array($actionType, $textExtractionActions)) {
            if ($hasImages && !$hasExtractableText) {
                // PDF has images but no extractable text
                $needsOcr = true;
                $reason = 'PDF contains images but lacks extractable text content';
            } elseif ($isImageHeavy && !$hasExtractableText) {
                // PDF is mostly images
                $needsOcr = true;
                $reason = 'PDF appears to be mostly scanned images';
            } elseif ($isImageHeavy && $hasExtractableText && ($imageDetection['percentage_pages_with_images'] ?? 0) > 70) {
                // PDF is primarily images even with some text
                $needsOcr = true;
                $reason = 'PDF is primarily image-based (>70% of pages contain images)';
            }
        }
        
        return [
            'recommended' => $needsOcr,
            'reason' => $reason,
            'recommendation' => $needsOcr ? $this->getOcrRecommendationMessage($actionType, $reason) : null,
        ];
    }
    
    /**
     * Get OCR recommendation message
     * 
     * @param string $actionType The action type
     * @param string $reason The reason for recommendation
     * @return string The recommendation message
     */
    protected function getOcrRecommendationMessage(string $actionType, ?string $reason): string
    {
        return sprintf(
            'We recommend running OCR (Optical Character Recognition) on this PDF before %s. %s. OCR will extract text from images, making the content searchable and more usable for text operations.',
            $this->getActionDisplayName($actionType),
            $reason ? ucfirst($reason) : 'Your PDF contains scanned images'
        );
    }
    
    /**
     * Get human-readable action display name
     * 
     * @param string $actionType The action type constant
     * @return string Display name
     */
    protected function getActionDisplayName(string $actionType): string
    {
        $displayNames = [
            self::ACTION_EXTRACT_TEXT => 'extracting text',
            self::ACTION_CONVERT_TO_TEXT => 'converting to text',
            self::ACTION_CONVERT_TO_DOCX => 'converting to Word',
            self::ACTION_CONVERT_TO_XLSX => 'converting to Excel',
            self::ACTION_CONVERT_TO_PPTX => 'converting to PowerPoint',
            self::ACTION_EXTRACT_KEYWORDS => 'extracting keywords',
            self::ACTION_TRANSLATE => 'translating',
            self::ACTION_SUMMARIZE => 'summarizing',
            self::ACTION_CHAT => 'analyzing with AI chat',
            self::ACTION_FILE_TO_PDF => 'converting to PDF',
            self::ACTION_MERGE_PDF => 'merging PDFs',
            self::ACTION_SPLIT_PDF => 'splitting PDF',
            self::ACTION_COMPRESS_PDF => 'compressing PDF',
            self::ACTION_PROTECT_PDF => 'protecting PDF',
            self::ACTION_SIGN_PDF => 'signing PDF',
            self::ACTION_WATERMARK_PDF => 'watermarking PDF',
            self::ACTION_UNLOCK_PDF => 'unlocking PDF',
            self::ACTION_ORGANIZE_PDF => 'organizing PDF',
            self::ACTION_ADD_PAGE_NUMBERS => 'adding page numbers',
            self::ACTION_PDF_TO_IMAGE => 'converting to images',
        ];
        
        return $displayNames[$actionType] ?? $actionType;
    }
    
    /**
     * Get action-specific recommendations and warnings
     * 
     * @param string $actionType The action type
     * @param array $fileInfo File information
     * @return array List of recommendations
     */
    protected function getActionSpecificRecommendations(string $actionType, array $fileInfo): array
    {
        $recommendations = [];
        $extension = $fileInfo['extension'] ?? '';
        $size = $fileInfo['size'] ?? 0;
        
        // File size warnings
        if ($size > 50 * 1024 * 1024) { // 50MB
            $recommendations[] = [
                'type' => 'warning',
                'message' => 'This is a large file (>50MB). Processing may take longer than usual.',
            ];
        }
        
        // Action-specific recommendations
        switch ($actionType) {
            case self::ACTION_EXTRACT_TEXT:
            case self::ACTION_CONVERT_TO_TEXT:
            case self::ACTION_CONVERT_TO_DOCX:
            case self::ACTION_EXTRACT_KEYWORDS:
            case self::ACTION_SUMMARIZE:
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'For best results with text operations, ensure your PDF contains searchable text (not scanned images).',
                ];
                break;
                
            case self::ACTION_TRANSLATE:
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'Translation works best with PDFs containing searchable text. Scanned documents may require OCR first.',
                ];
                break;
                
            case self::ACTION_CHAT:
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'AI chat analysis requires text content. PDFs with only images will have limited analytical capability.',
                ];
                break;
                
            case self::ACTION_PDF_TO_IMAGE:
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'PDF conversion to images works best with PDFs containing vector graphics. Image-heavy PDFs may result in lower quality.',
                ];
                break;
                
            case self::ACTION_PROTECT_PDF:
            case self::ACTION_SIGN_PDF:
            case self::ACTION_WATERMARK_PDF:
                $recommendations[] = [
                    'type' => 'info',
                    'message' => 'This operation preserves the PDF structure. Original content will remain unchanged.',
                ];
                break;
        }
        
        return $recommendations;
    }
    
    /**
     * Get all supported action types
     * 
     * @return array List of action type constants
     */
    public static function getSupportedActions(): array
    {
        return [
            self::ACTION_EXTRACT_TEXT,
            self::ACTION_CONVERT_TO_TEXT,
            self::ACTION_CONVERT_TO_DOCX,
            self::ACTION_CONVERT_TO_XLSX,
            self::ACTION_CONVERT_TO_PPTX,
            self::ACTION_EXTRACT_KEYWORDS,
            self::ACTION_TRANSLATE,
            self::ACTION_SUMMARIZE,
            self::ACTION_CHAT,
            self::ACTION_FILE_TO_PDF,
            self::ACTION_MERGE_PDF,
            self::ACTION_SPLIT_PDF,
            self::ACTION_COMPRESS_PDF,
            self::ACTION_PROTECT_PDF,
            self::ACTION_SIGN_PDF,
            self::ACTION_WATERMARK_PDF,
            self::ACTION_UNLOCK_PDF,
            self::ACTION_ORGANIZE_PDF,
            self::ACTION_ADD_PAGE_NUMBERS,
            self::ACTION_PDF_TO_IMAGE,
        ];
    }
}
