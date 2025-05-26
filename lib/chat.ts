'use server';

import { currentUser } from "@clerk/nextjs/server";
import OpenAI from 'openai';
import { getDbConnection } from "./db";
import { getSummaryById } from "./summaries";

// Initialize OpenAI client configured for Llama API
const openai = new OpenAI({
  apiKey: process.env.DEEPSEEKR1_API_KEY || '',
  baseURL:"https://openrouter.ai/api/v1", // Llama API endpoint
});

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: Date;
};

export type Chat = {
  id: string;
  user_id: string;
  pdf_summary_id: string;
  title: string;
  created_at: Date;
  updated_at: Date;
  messages?: ChatMessage[];
};

/**
 * Create a new chat for a PDF summary
 */
export async function createChat(pdfSummaryId: string, title: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify the summary exists and belongs to the user
  const summary = await getSummaryById(pdfSummaryId);
  if (!summary || summary.user_id !== userId) {
    throw new Error("Summary not found or doesn't belong to the user");
  }

  const sql = await getDbConnection();
  
  // First check if a chat with this title already exists for this PDF
  const existingChats = await sql`
    SELECT * FROM pdf_chats 
    WHERE user_id = ${userId} 
    AND pdf_summary_id = ${pdfSummaryId} 
    AND LOWER(title) = LOWER(${title})
    LIMIT 1
  `;

  // If a chat with this title already exists, return it instead of creating a duplicate
  if (existingChats.length > 0) {
    return existingChats[0];
  }

  // Otherwise create a new chat
  const [chat] = await sql`
    INSERT INTO pdf_chats (user_id, pdf_summary_id, title)
    VALUES (${userId}, ${pdfSummaryId}, ${title})
    RETURNING *
  `;

  return chat;
}

/**
 * Get all chats for a user
 */
export async function getUserChats() {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const sql = await getDbConnection();
  const chats = await sql`
    SELECT c.*, s.title as summary_title, s.file_name
    FROM pdf_chats c
    LEFT JOIN pdf_summaries s ON c.pdf_summary_id = s.id
    WHERE c.user_id = ${userId}
    ORDER BY c.updated_at DESC
  `;

  return chats;
}

/**
 * Get a single chat by ID with its messages
 */
export async function getChatById(chatId: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const sql = await getDbConnection();
  
  // Get the chat
  const [chat] = await sql`
    SELECT c.*, s.title as summary_title, s.file_name
    FROM pdf_chats c
    JOIN pdf_summaries s ON c.pdf_summary_id = s.id
    WHERE c.id = ${chatId} AND c.user_id = ${userId}
  `;

  if (!chat) {
    return null;
  }

  // Get the messages
  const messages = await sql`
    SELECT *
    FROM chat_messages
    WHERE chat_id = ${chatId}
    ORDER BY created_at ASC
  `;

  return {
    ...chat,
    messages
  };
}

/**
 * Get all chats for a PDF summary
 */
export async function getChatsByPdfSummaryId(pdfSummaryId: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const sql = await getDbConnection();
  const chats = await sql`
    SELECT *
    FROM pdf_chats
    WHERE pdf_summary_id = ${pdfSummaryId} AND user_id = ${userId}
    ORDER BY updated_at DESC
  `;

  return chats;
}

/**
 * Add a message to a chat
 */
export async function addMessageToChat(chatId: string, role: 'user' | 'assistant', content: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Verify the chat exists and belongs to the user
  const sql = await getDbConnection();
  const [chat] = await sql`
    SELECT * FROM pdf_chats WHERE id = ${chatId} AND user_id = ${userId}
  `;

  if (!chat) {
    throw new Error("Chat not found or doesn't belong to the user");
  }

  // Add the message
  const [message] = await sql`
    INSERT INTO chat_messages (chat_id, role, content)
    VALUES (${chatId}, ${role}, ${content})
    RETURNING *
  `;

  // Update the chat's updated_at timestamp
  await sql`
    UPDATE pdf_chats
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = ${chatId}
  `;

  return message;
}

/**
 * Process a user message and generate a response
 */
export async function processUserMessage(chatId: string, message: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  // Get the chat and associated PDF summary
  const sql = await getDbConnection();
  const [chat] = await sql`
    SELECT c.*, s.summary_text, s.title as summary_title
    FROM pdf_chats c
    JOIN pdf_summaries s ON c.pdf_summary_id = s.id
    WHERE c.id = ${chatId} AND c.user_id = ${userId}
  `;

  if (!chat) {
    throw new Error("Chat not found or doesn't belong to the user");
  }

  // Add the user message to the chat
  await addMessageToChat(chatId, 'user', message);

  // Get previous messages for context
  const messages = await sql`
    SELECT *
    FROM chat_messages
    WHERE chat_id = ${chatId}
    ORDER BY created_at ASC
  `;

  // Prepare the context for the AI
const systemPrompt = `You're a helpful and knowledgeable AI assistant who answers questions about the following PDF document in a friendly, clear, and conversational way.

Summary of the document:
${chat.summary_text}

Use the summary to provide accurate answers to user questions. Explain technical concepts simply, like you're teaching a curious friend or student—without dumbing things down. Be concise, but feel free to use examples, analogies, or short explanations to make your answer easier to understand.

If a question can’t be answered from the summary, let the user know politely and suggest what additional information might be needed.

Your tone should be natural, confident, and human—think: helpful tutor or engineer explaining something over coffee. Avoid sounding robotic or overly formal.`;


  // Convert messages to OpenAI format (compatible with Llama API)
  const llamaMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  // Get response from Llama API
  try {
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages: llamaMessages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
      // Remove headers that might not be supported by Llama API
    });

    const aiResponse = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    
    // Add the AI response to the chat
    await addMessageToChat(chatId, 'assistant', aiResponse);
    
    return aiResponse;
  } catch (error) {
    console.error("Error generating Llama response:", error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
    
    const errorMessage = "Sorry, there was an error processing your request. Please try again later.";
    await addMessageToChat(chatId, 'assistant', errorMessage);
    return errorMessage;
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string) {
  const user = await currentUser();
  const userId = user?.id;
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const sql = await getDbConnection();
  
  // Verify the chat exists and belongs to the user
  const [chat] = await sql`
    SELECT * FROM pdf_chats WHERE id = ${chatId} AND user_id = ${userId}
  `;

  if (!chat) {
    throw new Error("Chat not found or doesn't belong to the user");
  }

  // Delete the chat (and all associated messages due to CASCADE)
  await sql`
    DELETE FROM pdf_chats WHERE id = ${chatId}
  `;

  return { success: true };
}