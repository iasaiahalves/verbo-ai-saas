import { SUMMARY_SYSTEM_PROMPT } from '@/utils/prompts';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Maximum content length to send in a single request
const MAX_CHUNK_SIZE = 30000; // characters, adjust based on token limits

export const generateSummaryFromGemini = async (pdfText: string) => {
  try {
    // Create model instance with improved configuration
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // Updated to use correct model name
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Implement chunking for longer texts
    let finalSummary = '';
    if (pdfText.length > MAX_CHUNK_SIZE) {
      // Process the document in chunks if it's too large
      const chunks = splitTextIntoChunks(pdfText, MAX_CHUNK_SIZE);
      const chunkSummaries = [];

      for (const chunk of chunks) {
        const chunkSummary = await processSingleChunk(model, chunk);
        chunkSummaries.push(chunkSummary);
      }

      // If we have multiple summaries, summarize those summaries
      if (chunkSummaries.length > 1) {
        const combinedChunks = chunkSummaries.join('\n\n=== NEXT SECTION ===\n\n');
        finalSummary = await processSingleChunk(
          model, 
          combinedChunks, 
          'The following are summaries of different sections of a document. Create one cohesive summary that captures the key points across all sections:'
        );
      } else {
        finalSummary = chunkSummaries[0];
      }
    } else {
      // If the text is within limits, process it directly
      finalSummary = await processSingleChunk(model, pdfText);
    }

    return finalSummary;

  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // More comprehensive error handling
    if (error?.message?.includes('quota') || error?.response?.status === 429 || error?.status === 429) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    if (error?.message?.includes('context length') || error?.message?.includes('too long')) {
      throw new Error('CONTENT_TOO_LONG');
    }

    // Add timeout handling
    if (error.name === 'AbortError' || error?.message?.includes('timeout')) {
      throw new Error('REQUEST_TIMEOUT');
    }

    throw error;
  }
};

// Helper function to process a single chunk of text
async function processSingleChunk(model: any, chunkText: string, customInstruction?: string) {
  // Create a controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
  
  try {
    const instruction = customInstruction || 
      `Transform this document into an engaging, easy-to-read summary with contextually relevant emojis and proper markdown formatting:`;
    
    const prompt = {
      contents: [
        {
          role: 'user', 
          parts: [
            {
              text: SUMMARY_SYSTEM_PROMPT
            }, 
            {
              text: `${instruction}\n\n${chunkText}`,
            },
          ],
        },
      ],
    };

    const result = await model.generateContent(prompt, { signal: controller.signal });
    const generatedText = result.response.text();

    if (!generatedText) {
      console.warn("Gemini API did not generate text. Check input or potential issues.");
      throw new Error("Gemini API did not generate a summary.");
    }

    return generatedText;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Helper function to split text into manageable chunks
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