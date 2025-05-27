'use client';
import { generatePdfSummary, storePdfSummaryAction } from "@/actions/upload-actions";
import UploadFormInput from "@/components/upload/upload-form-input";
import { useUploadThing } from "@/utils/uploadthing";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import LoadingSkeleton from "./loading-skeleton";

const schema = z.object({
  file: z.instanceof(File, { message: 'Invalid file' })
    .refine((file) => file.size <= 20 * 1024 * 1024,
     'File size must be less than 20MB'
    )
    .refine((file) => file.type.startsWith('application/pdf'),
      'File must be a PDF'
    ),
});

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const { startUpload, routeConfig } = useUploadThing("pdfUploader", {
    onClientUploadComplete: () => {
      console.log("uploaded successfully!");
      // We'll handle the success toast in the main flow instead
    },
    onUploadError: (err) => {
      console.error("error occurred while uploading", err);
      toast.error("Error occurred while uploading", {
        description: err.message
      });
      setIsLoading(false);
    },
    onUploadBegin: (fileName: string) => {
      console.log("upload has begun for", fileName);
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
        setIsLoading(false);
        return;
      }
      
      // Show different toast messages based on file size
      const isLargeFile = file.size > 5 * 1024 * 1024; // 5MB threshold
      
      const uploadToastId = toast.loading(
        isLargeFile ? 'Uploading large PDF...' : 'Uploading PDF...', 
        {
          description: isLargeFile 
            ? 'Large file detected - this may take longer than usual'
            : 'We are uploading your PDF',
        }
      );

      // Upload the file to uploadthing
      const resp = await startUpload([file]);
      
      // Dismiss the upload toast
      toast.dismiss(uploadToastId);
      
      if (!resp) {
        toast.error('Something went wrong', {
          description: 'Please use a different file',
        });
        setIsLoading(false);
        return;
      }
      console.log(resp);

      // Create a new toast ID for processing with appropriate messaging
      const processingToastId = toast.loading(
        isLargeFile ? 'Processing large PDF...' : 'Processing PDF', 
        {
          description: isLargeFile 
            ? 'Large documents take more time - please be patient while our AI reads through your document...'
            : 'Hang tight! Our AI is reading through your document...',
          duration: isLargeFile ? 0 : undefined, // Don't auto-dismiss for large files
        }
      );

      // Parse the pdf using lang chain
      const result = await generatePdfSummary([{
        serverData: {
          userId: resp[0]?.serverData?.userId || '',
          file: {
            url: resp[0]?.serverData?.file?.url || '',
            name: resp[0]?.serverData?.file?.name || '',
          },
        },
      }]);
      
      // Dismiss the processing toast
      toast.dismiss(processingToastId);
      
      const { data = null, message = null } = result || {};

      if (data && data.summary) {
        // Create a new toast ID for saving with redirect message
        const savingToastId = toast.loading('Saving PDF...', {
          description: 'Hang tight! We are saving your summary and redirecting you...',
        });
   
        const storeResult = await storePdfSummaryAction({
          summary: data.summary,
          fileUrl: resp[0].serverData.file.url,
          title: data.title,
          fileName: file.name,
        });
          
        // Dismiss the saving toast
        toast.dismiss(savingToastId);
        
        // Reset form immediately
        formRef.current?.reset();
        
        if (storeResult.data?.id) {
          // Show success toast that will persist during navigation
          toast.success('Summary saved! Redirecting...', {
            description: 'Taking you to your summary now!',
            duration: 2000,
          });
          
          // Immediate redirect without waiting
          router.push(`/summaries/${storeResult.data.id}`);
        } else {
          toast.error('Failed to save summary', {
            description: 'Unable to retrieve summary ID',
          });
          setIsLoading(false);
        }
      } else {
        toast.error('Processing failed', {
          description: message || 'Unable to generate a summary for this PDF',
        });
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error('Error occurred', error);
      toast.error('An unexpected error occurred', {
        description: 'Please try again later',
      });
      formRef.current?.reset();
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-8 w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-muted-foreground text-sm">
            Upload PDF
          </span>
        </div>
      </div>
      
      <UploadFormInput isLoading={isLoading} ref={formRef} onSubmit={handleSubmit} />
      
      {isLoading && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-muted-foreground text-sm">
                Processing
              </span>
            </div>
          </div>
          <LoadingSkeleton />
        </>
      )}
    </div>
  );
}