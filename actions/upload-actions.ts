'use server';

import { fetchAndExtractPdfText } from "@/lib/langchain";

export async function generatePdfSummary(uploadResponse: [{
  serverData: {
    userId: string;
    file: {
      url: string;
      name: string;
    }
  }
}]) {
  if (!uploadResponse) {
    return {
      success: false,
      message: 'File upload failed (no upload response)',
      data: null,
    };
  }

  const {
    serverData: {
      userId,
      file: { url: pdfUrl, name: fileName },
    },
  } = uploadResponse[0];

  if (!pdfUrl) {
    return {
      success: false,
      message: 'File upload failed (missing file URL)',
      data: null,
    };
  }

  try {
    const pdfText = await fetchAndExtractPdfText(pdfUrl);
    console.log({ pdfText });

    // ✅ You need to return something here
    return {
      success: true,
      message: 'PDF processed successfully',
      data: {
        userId,
        fileName,
        pdfText,
      }
    };

  } catch (err) {
    console.error('Error while extracting PDF:', err);
    return {
      success: false,
      message: 'PDF processing failed',
      data: null,
    };
  }
}
