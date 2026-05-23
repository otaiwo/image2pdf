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
        $content = Storage::disk('temp')->get($filePath);
        $parser = new Parser();
        $pdf = $parser->parseContent($content);
        $text = $pdf->getText();

        // Basic text cleaning and truncation to fit context window
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
}
