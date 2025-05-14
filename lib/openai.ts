import { SUMMARY_SYSTEM_PROMPT } from '@/utils/prompts'; // Assuming you still have this prompt
import OpenAI from 'openai';

// Access your OpenRouter API key as an environment variable
const OPENROUTER_API_KEY = process.env.LLAMA_API_KEY || '';

// Maximum content length to send in a single request
// Adjust based on Llama 3.1's context window and OpenRouter's limits
const MAX_CHUNK_SIZE = 10000; // Example size, needs testing

// Initialize the OpenAI client pointed to OpenRouter
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1', // OpenRouter API base URL
  apiKey: OPENROUTER_API_KEY, // Use your OpenRouter API key
});

export async function generateSummaryFromOpenRouter(pdfText: string) { // Renamed function
  try {
    let finalSummary = '';

    // Re-introducing chunking for handling large texts
    if (pdfText.length > MAX_CHUNK_SIZE) {
      const chunks = splitTextIntoChunks(pdfText, MAX_CHUNK_SIZE);
      const chunkSummaries = [];

      for (const chunk of chunks) {
        // Process each chunk
        const chunkSummary = await processSingleChunk(chunk);
        chunkSummaries.push(chunkSummary);
      }

      // If multiple summaries, summarize the summaries
      if (chunkSummaries.length > 1) {
        const combinedChunks = chunkSummaries.join('\n\n=== NEXT SECTION ===\n\n');
        finalSummary = await processSingleChunk(
          combinedChunks,
          'The following are summaries of different sections of a document. Create one cohesive summary that captures the key points across all sections:'
        );
      } else {
        finalSummary = chunkSummaries[0];
      }
    } else {
      // Process directly if within limits
      finalSummary = await processSingleChunk(pdfText);
    }

    return finalSummary;

  } catch (error: any) {
    console.error('OpenRouter API Error:', error);

    // Error handling based on OpenAI library and OpenRouter responses
    if (error?.status === 429 || error.response?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }

    // Check for context length errors - wording might vary
     if (error.message?.includes('context window') || error.message?.includes('too long')) {
        throw new Error('CONTENT_TOO_LONG');
    }

     // Timeout handling (AbortController used in processSingleChunk)
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('REQUEST_TIMEOUT');
    }


    throw error;
  }
}

// Helper function to process a single chunk of text using OpenAI via OpenRouter
async function processSingleChunk(chunkText: string, customInstruction?: string) {
   // Create a controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout (adjust as needed)

  try {
    const instruction = customInstruction ||
      `Transform this document into an engaging, easy-to-read summary with contextually relevant emojis and proper markdown formatting:`;

    const completion = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify Llama 3.1 model from OpenRouter
      messages: [
        {
          role: 'system',
          content: SUMMARY_SYSTEM_PROMPT // Use your system prompt
        },
        {
          role: 'user',
          content: `${instruction}\n\n${chunkText}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500, // Adjust as needed for Llama 3.1
    }, { signal: controller.signal }); // Pass the signal for timeout

    const generatedText = completion.choices[0].message.content;

     if (!generatedText) {
      console.warn("OpenRouter API did not generate text. Check input or potential issues.");
      throw new Error("OpenRouter API did not generate a summary.");
    }

    return generatedText;
  } finally {
    clearTimeout(timeoutId); // Clear timeout regardless of outcome
  }
}

// Helper function to split text into manageable chunks (same as before)
function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];

  // Try to split on paragraph boundaries
  const paragraphs = text.split(/\n\s*\n/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the chunk size
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  // Add the last chunk if it has content
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
