<?php

namespace App\Services\AI;

use OpenAI;
use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PdfChatService
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
     * Answer a question based on PDF content.
     *
     * @param string $pdfText Extracted text from the PDF
     * @param string $question User's question
     * @param array $history Previous chat messages
     * @return string Answer
     */
    public function ask(string $pdfText, string $question, array $history = []): string
    {
        if (!$this->client) {
            return "AI Chat is currently in mock mode. You asked: '{$question}'. Content context is available.";
        }

        // Limit context size
        $context = mb_substr($pdfText, 0, 10000);

        $messages = [
            ['role' => 'system', 'content' => "You are a helpful assistant. Answer the user's question strictly based on the provided PDF content. If the answer is not in the text, say you don't know.\n\nPDF CONTENT:\n" . $context],
        ];

        // Add history
        foreach ($history as $msg) {
            $messages[] = $msg;
        }

        $messages[] = ['role' => 'user', 'content' => $question];

        try {
            $response = $this->client->chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => $messages,
            ]);

            return $response->choices[0]->message->content;
        } catch (\Exception $e) {
            Log::error("OpenAI Chat Error: " . $e->getMessage());
            throw $e;
        }
    }
}
