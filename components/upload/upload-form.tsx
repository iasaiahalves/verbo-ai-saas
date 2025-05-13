'use client';
import { generatePdfSummary } from "@/actions/upload-actions";
import UploadFormInput from "@/components/upload/upload-form-input";
import { useUploadThing } from "@/utils/uploadthing";
import { toast } from "sonner";
import { z } from "zod";



const schema = z.object({
  file: z.instanceof(File, { message: 'Invalid file' })
    .refine((file) => file.size <= 20 * 1024 * 1024,
     'File size must be less than 20MB'
    )
    .refine((file) => file.type.startsWith('application/pdf'),
      'File must be a PDF'
    ),
})


export default function UploadForm() {

  const { startUpload, routeConfig } = useUploadThing("pdfUploader", {
    onClientUploadComplete: () => {
      console.log("uploaded successfully!");
       toast.success("File uploaded successfully!");
    },
    onUploadError: (err) => {
      console.error("error occurred while uploading", err);
      // Corrected: Use toast.error(title, { description })
      // Also corrected typo "occured" to "occurred"
      toast.error("Error occurred while uploading", {
        description: err.message
      });
    },
    onUploadBegin: ({ file }) => { // 'file' here is the filename (string)
      console.log("upload has begun for", file);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('submitted');
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    // validating the fields
    const validatedFields = schema.safeParse({ file });
    console.log(validatedFields);

    if (!validatedFields.success) {
      // Corrected: Use toast.error(title, { description })
      toast.error('❌ Something went wrong', {
        description:
          validatedFields.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file',
      });
      return;
    }


    // Corrected: Use toast.loading(title, { description }) for in-progress actions
    toast.loading('Uploading PDF..', {
      description: 'We are uploading your PDF',
    });


    //upload the file to uploadthing
    const resp = await startUpload([file]);
    if (!resp) {
      // Corrected: Use toast.error(title, { description })
      toast.error('Something went wrong', {
        description: 'Please use a different file',
      });
      return;
    }


    // Corrected: Use toast.loading(title, { description }) for next step
    toast.loading('Processing PDF', {
      description: 'Hang tight! Our AI is reading through your document..',
    });

    //parse the pdf using lang chain

    const summary = await generatePdfSummary(resp); 
    console.log({ summary });
    //summarize the pdf using AI
    //save the summary to the database
    //redirect to the individual summary page


  }
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <UploadFormInput onSubmit={handleSubmit} />
    </div>
  )
}
