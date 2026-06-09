<?php

namespace App\Services\Pdf;

use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Log;

class PdfImageDetectionService
{
    /**
     * Check if a PDF contains any images
     * 
     * @param string $filePath Path to the PDF file
     * @return array Detection results with status and details
     */
    public function detectImages(string $filePath): array
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            
            $pages = $pdf->getPages();
            $totalPages = count($pages);
            $pagesWithImages = 0;
            $totalImages = 0;
            $imageDetails = [];
            
            foreach ($pages as $pageIndex => $page) {
                $images = $this->extractImagesFromPage($page);
                if (!empty($images)) {
                    $pagesWithImages++;
                    $totalImages += count($images);
                    $imageDetails[] = [
                        'page' => $pageIndex + 1,
                        'count' => count($images),
                        'images' => $images,
                    ];
                }
            }
            
            $hasImages = $totalImages > 0;
            
            Log::info('PDF image detection completed', [
                'file' => $filePath,
                'has_images' => $hasImages,
                'total_images' => $totalImages,
                'pages_with_images' => $pagesWithImages,
                'total_pages' => $totalPages,
            ]);
            
            return [
                'success' => true,
                'has_images' => $hasImages,
                'total_images' => $totalImages,
                'pages_with_images' => $pagesWithImages,
                'total_pages' => $totalPages,
                'image_details' => $imageDetails,
                'percentage_pages_with_images' => $totalPages > 0 ? round(($pagesWithImages / $totalPages) * 100, 2) : 0,
            ];
        } catch (\Exception $e) {
            Log::error('PDF image detection failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'has_images' => false,
            ];
        }
    }
    
    /**
     * Extract images from a PDF page
     * 
     * @param mixed $page PDF page object
     * @return array List of image objects found on the page
     */
    private function extractImagesFromPage($page): array
    {
        $images = [];
        
        try {
            if (method_exists($page, 'getXObjects')) {
                $xObjects = $page->getXObjects();
                
                if ($xObjects) {
                    foreach ($xObjects as $xObject) {
                        if ($this->isImageXObject($xObject)) {
                            $images[] = [
                                'type' => $this->getImageType($xObject),
                                'width' => $this->getImageDimension($xObject, 'Width'),
                                'height' => $this->getImageDimension($xObject, 'Height'),
                                'size' => strlen($xObject->getContent() ?? ''),
                            ];
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Log::debug('Error extracting images from page', [
                'error' => $e->getMessage(),
            ]);
        }
        
        return $images;
    }
    
    /**
     * Check if an XObject is an image
     * 
     * @param mixed $xObject XObject to check
     * @return bool
     */
    private function isImageXObject($xObject): bool
    {
        try {
            $subtype = $xObject->getHeader()->get('Subtype');
            return $subtype && strtolower((string)$subtype) === 'image';
        } catch (\Exception $e) {
            return false;
        }
    }
    
    /**
     * Get image type/format
     * 
     * @param mixed $xObject XObject to analyze
     * @return string Image type
     */
    private function getImageType($xObject): string
    {
        try {
            $filter = $xObject->getHeader()->get('Filter');
            if ($filter) {
                $filterStr = strtolower((string)$filter);
                if (strpos($filterStr, 'flate') !== false) {
                    return 'PNG';
                } elseif (strpos($filterStr, 'dct') !== false) {
                    return 'JPEG';
                }
            }
            return 'Image';
        } catch (\Exception $e) {
            return 'Image';
        }
    }
    
    /**
     * Get image dimension
     * 
     * @param mixed $xObject XObject to analyze
     * @param string $dimension 'Width' or 'Height'
     * @return int|null
     */
    private function getImageDimension($xObject, string $dimension): ?int
    {
        try {
            $value = $xObject->getHeader()->get($dimension);
            return $value ? (int)$value : null;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    /**
     * Check if PDF has text content (extracted text)
     * This helps determine if OCR might be needed
     * 
     * @param string $filePath Path to the PDF file
     * @return array Analysis results
     */
    public function analyzeTextContent(string $filePath): array
    {
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($filePath);
            
            $pages = $pdf->getPages();
            $totalPages = count($pages);
            $pagesWithText = 0;
            $totalTextLength = 0;
            
            foreach ($pages as $page) {
                $text = $page->getText();
                $textLength = strlen(trim($text ?? ''));
                
                if ($textLength > 50) { // More than 50 characters is considered "has text"
                    $pagesWithText++;
                }
                $totalTextLength += $textLength;
            }
            
            $hasExtractableText = $totalTextLength > 100; // Overall threshold
            
            return [
                'success' => true,
                'has_extractable_text' => $hasExtractableText,
                'pages_with_text' => $pagesWithText,
                'total_pages' => $totalPages,
                'total_text_length' => $totalTextLength,
                'average_text_per_page' => $totalPages > 0 ? round($totalTextLength / $totalPages, 2) : 0,
            ];
        } catch (\Exception $e) {
            Log::error('PDF text analysis failed', [
                'file' => $filePath,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'has_extractable_text' => false,
                'error' => $e->getMessage(),
            ];
        }
    }
}
