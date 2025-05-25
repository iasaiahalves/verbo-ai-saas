'use server';

import { getChatById } from "@/lib/chat";
import { getSummaryById } from "@/lib/summaries";

export async function fetchChatData(chatId: string) {
  try {
    const chatData = await getChatById(chatId);
    return chatData;
  } catch (error) {
    console.error("Error fetching chat:", error);
    throw new Error("Failed to fetch chat data");
  }
}

export async function fetchSummaryData(summaryId: string) {
  try {
    const summaryData = await getSummaryById(summaryId);
    return summaryData;
  } catch (error) {
    console.error("Error fetching summary:", error);
    throw new Error("Failed to fetch summary data");
  }
}