'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  required?: boolean;
  onChange: (files: File[]) => void;
  existingFiles?: string[];
  helperText?: string;
  error?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  uploaded: boolean;
}

export default function FileUpload({
  label,
  accept = 'image/*,.pdf',
  maxSizeMB = 10,
  multiple = false,
  required = false,
  onChange,
  existingFiles = [],
  helperText,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const validFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name}: File size must be less than ${maxSizeMB}MB`);
        return;
      }

      // Create preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      validFiles.push({
        file,
        preview,
        uploaded: false,
      });
    });

    if (errors.length > 0) {
      setUploadError(errors.join(', '));
      return;
    }

    setUploadError('');

    if (multiple) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onChange(updatedFiles.map(f => f.file));
    } else {
      setFiles(validFiles);
      onChange(validFiles.map(f => f.file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    onChange(updatedFiles.map(f => f.file));
    
    // Revoke object URL to prevent memory leaks
    if (files[index].preview) {
      URL.revokeObjectURL(files[index].preview!);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Drop Zone */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-brand-green bg-brand-green/5'
            : error || uploadError
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="hidden"
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <button
              type="button"
              onClick={openFileDialog}
              className="text-brand-green hover:text-brand-green/80 font-medium"
            >
              Click to upload
            </button>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {accept.includes('image') && accept.includes('pdf')
              ? 'PDF, PNG, JPG, WEBP'
              : accept.includes('image')
              ? 'PNG, JPG, WEBP'
              : 'PDF only'}{' '}
            (max {maxSizeMB}MB)
          </p>
        </div>
      </div>

      {/* Helper Text */}
      {helperText && !error && !uploadError && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Error Message */}
      {(error || uploadError) && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error || uploadError}
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileWithPreview, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {fileWithPreview.preview ? (
                  <img
                    src={fileWithPreview.preview}
                    alt="Preview"
                    className="h-10 w-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                    {fileWithPreview.file.type === 'application/pdf' ? (
                      <FileText className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {fileWithPreview.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileWithPreview.file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {fileWithPreview.uploaded && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Existing Files:</p>
          <div className="space-y-2">
            {existingFiles.map((fileUrl, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate"
                  >
                    View uploaded file
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

