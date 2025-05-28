'use server';

import { getDbConnection } from "@/lib/db";
import { generateSummaryFromGemini } from "@/lib/geminiai";
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
      summary = await generateSummaryFromOpenRouter(pdfText);
      console.log({ summary });
    } catch (error: any) {
      console.log(error);
      //call llama
      if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED' || error.message === 'CONTENT_TOO_LONG' || error.message === 'REQUEST_TIMEOUT') {
        try {
          summary = await generateSummaryFromGemini(pdfText);
        } catch (geminiError) {
          console.error('Gemini API failed after Llama-3 quote exceeded', geminiError);
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
    const sql = await getDbConnection(); // Assuming sql is a tagged template literal function like from 'postgres'
    const rows = await sql`
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
    ) RETURNING id, summary_text`;

    // Check if any rows were returned and return the first one
    if (rows && rows.length > 0) {
      return rows[0]; // This will be an object like { id: '...', summary_text: '...' }
    }
    // If no rows are returned, it means the insert might have failed silently or RETURNING didn't work as expected.
    return null; // Or throw an error: throw new Error("Failed to save summary to database or retrieve ID.");
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
    if (!savedSummary || !savedSummary.id) { // Ensure savedSummary and its id exist
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
  revalidatePath(`/summaries/${savedSummary.id}`); // Now savedSummary.id should be reliably available
  return {
      success: true,
    message: 'PDF summary saved successfully',
    data: {
        id: savedSummary.id, // Accessing id from the returned row object
      }
    }
}