'use client';

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, FileText, Loader2, Upload } from "lucide-react";
import { forwardRef, useRef, useState } from "react";

interface UploadFormInputProps{
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export const UploadFormInput = forwardRef<HTMLFormElement, UploadFormInputProps>(({ onSubmit, isLoading }, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showLargeFileNotice, setShowLargeFileNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    
    // Show large file notice if file is larger than 5MB
    const isLargeFile = file.size > 5 * 1024 * 1024;
    setShowLargeFileNotice(isLargeFile);
    
    // Update the file input
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form
      ref={ref}
      className="flex flex-col gap-6"
      onSubmit={onSubmit}
    >
      {/* Large File Processing Notice */}
      {showLargeFileNotice && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2 text-left">
                Large Document Processing
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mb-3 text-left">
                This document is large and may take several minutes to process.
              </p>
              <div className="text-sm text-amber-700 dark:text-amber-300 text-left">
                <p className="font-medium mb-2">For best results:</p>
                <ul className="list-disc space-y-1 ml-4">
                  <li>Consider uploading specific chapters separately for faster processing</li>
                  <li>Ensure stable internet connection during upload</li>
                  <li>Keep this tab open while processing</li>
                  <li>Processing time increases with document complexity and length</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
          isLoading && "opacity-50 cursor-not-allowed",
          selectedFile && "border-green-300 dark:border-green-600 bg-green-50/50 dark:bg-green-950/20"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          id="file"
          name="file"
          type="file"
          accept="application/pdf"
          required
          className="hidden"
          disabled={isLoading}
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center gap-4">
          {selectedFile ? (
            <>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-green-700 dark:text-green-300">
                  File Selected
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Upload className="h-8 w-8 text-gray-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  Upload a PDF document
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag and drop a file or click to browse
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Maximum file size: 20MB
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3">
            {!selectedFile && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBrowseClick}
                disabled={isLoading}
                className="text-sm"
              >
                Select File
              </Button>
            )}
            
            {selectedFile && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBrowseClick}
                  disabled={isLoading}
                  className="text-sm"
                >
                  Change File
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Upload PDF'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Progress indicator when loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Processing your PDF...
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                This may take a few moments
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File validation info */}
      <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
        Supported format: PDF files only • Maximum size: 20MB
      </div>
    </form>
  );
});

UploadFormInput.displayName = 'UploadFormInput';

export default UploadFormInput;