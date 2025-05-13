'use client';
import { generatePdfSummary } from "@/actions/upload-actions";
import UploadFormInput from "@/components/upload/upload-form-input";
import { useUploadThing } from "@/utils/uploadthing";
import { useRef, useState } from "react";
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

  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    try {
      setIsLoading(true);

      const formData = new FormData(e.currentTarget);
      const file = formData.get('file') as File;

      // validating the fields
      const validatedFields = schema.safeParse({ file });
      console.log(validatedFields);

      if (!validatedFields.success) {
        toast.error('❌ Something went wrong', {
          description:
            validatedFields.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file',
        });
        return;
      }


      
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
      console.log(resp);


      // Corrected: Use toast.loading(title, { description }) for next step
      toast.loading('Processing PDF', {
        description: 'Hang tight! Our AI is reading through your document..',
      });

    //parse the pdf using lang chain

    const result = await generatePdfSummary(resp); 
    
      const { data = null, message = null } = result || {};

      if (data) {
        toast.loading('Saving PDF...', {
          description: 'Hang tight! We are saving your summary!',
        });
        formRef.current?.rest();
        if (data.summary) {
          
        }
      }
      //summarize the pdf using AI
      //save the summary to the database
      //redirect to the individual summary page

    } catch (error) {
      setIsLoading(false);
      console.error('Error occured', error);
      formRef.current?.reset();
    }
    console.log('submitted');
  }  
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <UploadFormInput isLoading={isLoading} ref={formRef} onSubmit={handleSubmit} />
    </div>
  )
}
