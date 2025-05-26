import { getChatsByPdfSummaryId } from '@/lib/chat';
import { NextRequest, NextResponse } from 'next/server';

// Add a cache to prevent duplicate requests within a short time window
const requestCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pdfSummaryId = url.searchParams.get('pdfSummaryId');
    
    if (!pdfSummaryId) {
      return NextResponse.json({ error: 'Missing pdfSummaryId parameter' }, { status: 400 });
    }

    // Check if we have a cached response
    const cacheKey = `chats-${pdfSummaryId}`;
    const cachedData = requestCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp < CACHE_TTL)) {
      console.log(`Using cached chats data for PDF: ${pdfSummaryId}`);
      return NextResponse.json(cachedData.data);
    }
    
    console.log(`Fetching chats for PDF: ${pdfSummaryId}`);
    const chats = await getChatsByPdfSummaryId(pdfSummaryId);
    
    // Cache the result
    requestCache.set(cacheKey, { data: chats, timestamp: now });
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}