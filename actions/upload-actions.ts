'use server';

import { getDbConnection } from "@/lib/db";
import { generateSummaryFromOpenRouterDeepSeek } from "@/lib/deepseekai";
import { fetchAndExtractPdfText } from "@/lib/langchain";
import { generateSummaryFromOpenRouter } from "@/lib/openai";
import { formatFileNameAsTitle } from "@/utils/format-utils";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


interface PdfSummaryType{
  userId?: string;
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}


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

    let summary;
    try {
      summary = await generateSummaryFromOpenRouterDeepSeek(pdfText);
      console.log({ summary });
    } catch (error: any) {
      console.log(error);
      //call llama
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'CONTENT_TOO_LONG' || error.message === 'REQUEST_TIMEOUT') {
        try {
          summary = await generateSummaryFromOpenRouter(pdfText);
        } catch (llamaError) {
          console.error('Llama-3 API failed after Deepseek quote exceeded', llamaError);
        }
        throw new Error('Failed to generate summary with available AI providers')
      }
    }

    if (!summary) {
      return {
          success: false,
          message: 'Failed to generate summary',
          data: null,
      }
    }
    const formattedFileName = formatFileNameAsTitle(fileName);

    return {
      success: true,
      message: 'Summary generated successfully',
      data: {
        title: formattedFileName,
        summary,
      }
    }

  } catch (err) {
    console.error('Error while extracting PDF:', err);
    return {
      success: false,
      message: 'PDF processing failed',
      data: null,
    };
  }
}

async function savePdfsummary({ userId, fileUrl, summary, title, fileName }: {
  userId: string;
  fileUrl: string;
  summary: string;
  title: string;
  fileName: string;
}) {
  //sql inserting pdf summary
  try {
    const sql = await getDbConnection();
    await sql`
    INSERT INTO pdf_summaries(
    user_id,
    original_file_url,
    summary_text,
    title,
    file_name
    ) VALUES (
     ${userId},
     ${fileUrl},
     ${summary},
     ${title},
     ${fileName}
    )`;
  } catch (error) {
    console.error('Error saving PDF summary', error);
    throw error;
  }
}
export async function storePdfSummaryAction({
      
      fileUrl,
      summary,
      title,
      fileName,
    }: PdfSummaryType) {
  //user is logged in and has a userId

  //savepdf summary
  // savepdfsummary()
  let savedSummary;
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        message: 'User not found',
      };
    }
    savedSummary = await savePdfsummary({
      userId,
      fileUrl,
      summary,
      title,
      fileName,
    });
    if (!savedSummary) {
      return {
        success: false,
        message: 'Failed to save PDF summary, please try again...',
      }
    }
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error saving PDF summary',
      //4:19:50
      
    };
  }

  //Revalidate our cache
  revalidatePath(`/summaries/${savedSummary.id}`);
  return {
      success: true,
    message: 'PDF summary saved successfully',
    data: {
        id: savedSummary.id,
      }
    }
}