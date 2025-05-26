import { getChatsByPdfSummaryId } from '@/lib/chat';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pdfSummaryId = url.searchParams.get('pdfSummaryId');
    
    if (!pdfSummaryId) {
      return NextResponse.json({ error: 'Missing pdfSummaryId parameter' }, { status: 400 });
    }
    
    const chats = await getChatsByPdfSummaryId(pdfSummaryId);
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}