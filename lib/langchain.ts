import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';

export async function fetchAndExtractPdfText(fileUrl:
  string) {
  console.log('Attempting to fetch PDF from URL:', fileUrl);

  const response = await fetch(fileUrl);

  console.log('Fetch response status:', response.status);
  console.log('Fetch response Content-Type:', response.headers.get('Content-Type'));

  // If the content type is not PDF, log a snippet of the text to see what was fetched
  if (response.headers.get('Content-Type') !== 'application/pdf') {
    try {
      const textContent = await response.clone().text(); // Use .clone() as response.text() consumes the body
      console.warn('Fetched content is not PDF. First 500 chars of content:', textContent.substring(0, 500));
    } catch (e) {
      console.warn('Could not read text from non-PDF response body:', e);
    }
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();

  // You can directly use the blob obtained from the response
  const loader = new WebPDFLoader(blob);

  const docs = await loader.load();

  return docs.map((doc) => doc.pageContent).join('\n');
}