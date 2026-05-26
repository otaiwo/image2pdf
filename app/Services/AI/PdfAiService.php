<?php

namespace App\Services\AI;

use OpenAI;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PdfAiService
{
    protected $client;

    public function __construct()
    {
        $apiKey = config('services.openai.key');
        if ($apiKey) {
            $this->client = OpenAI::client($apiKey);
        }
    }

    /**
     * Summarize a PDF file.
     *
     * @param string $filePath Path on the 'temp' disk
     * @return string Summary
     */
    public function summarize(string $filePath): string
    {
        $text = $this->extractText($filePath);
        $truncatedText = mb_substr($text, 0, 12000);

        if (!$this->client) {
            Log::warning("OpenAI client not initialized. Returning mock summary.");
            return "This is a placeholder summary because the OpenAI API key is not configured. Content preview: " . mb_substr($text, 0, 200) . "...";
        }

        try {
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => 'You are a professional document analyst. Summarize the following document into key points and a brief overview.'],
                    ['role' => 'user', 'content' => $truncatedText],
                ],
            ]);

            return $response->choices[0]->message->content;
        } catch (\Exception $e) {
            Log::error("OpenAI Summary Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Extract keywords/tags from a PDF file.
     */
    public function extractKeywords(string $filePath): string
    {
        $text = $this->extractText($filePath);
        $truncatedText = mb_substr($text, 0, 12000);

        if (!$this->client) {
            return "document, pdf, analysis, information";
        }

        try {
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => 'Extract 5-10 relevant keywords or tags from the following document. Return them as a comma-separated list.'],
                    ['role' => 'user', 'content' => $truncatedText],
                ],
            ]);

            return $response->choices[0]->message->content;
        } catch (\Exception $e) {
            Log::error("OpenAI Keywords Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Translate PDF content.
     */
    public function translate(string $filePath, string $targetLanguage): string
    {
        $text = $this->extractText($filePath);
        $truncatedText = mb_substr($text, 0, 12000);

        if (!$this->client) {
            return "Translation to {$targetLanguage} is not available without API key.";
        }

        try {
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are a professional translator. Translate the following text into {$targetLanguage}. Maintain the tone and key information."],
                    ['role' => 'user', 'content' => $truncatedText],
                ],
            ]);

            return $response->choices[0]->message->content;
        } catch (\Exception $e) {
            Log::error("OpenAI Translation Error: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Helper to extract text from PDF.
     */
    protected function extractText(string $filePath): string
    {
        $content = Storage::disk('temp')->get($filePath);
        $parser = new Parser();
        $pdf = $parser->parseContent($content);
        return $pdf->getText();
    }
}
