import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';

export async function fetchAndExtractPdfText(fileUrl:
  string) {

  const response = await fetch(fileUrl);
  const blob = await response.blob();

  const arrayBuffer = await blob.arrayBuffer();

  const loader = new WebPDFLoader(new Blob([arrayBuffer]));

  const docs = await loader.load();

  return docs.map((doc) => doc.pageContent).join('\n');
  }