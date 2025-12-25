'use client';

import { useState } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { uploadFile } from '@/lib/supabase-storage';

interface DeliveryUploaderProps {
  orderId: string;
  sellerId: string;
  onSubmit: (message: string, attachments: string[]) => Promise<void>;
  onCancel?: () => void;
}

export default function DeliveryUploader({
  orderId,
  sellerId,
  onSubmit,
  onCancel,
}: DeliveryUploaderProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim() && files.length === 0) {
      setError('Please provide a message or attach files');
      return;
    }

    setUploading(true);

    try {
      // Upload files
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const result = await uploadFile(file, 'deliveries', sellerId);
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
        } else {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      // Submit delivery
      await onSubmit(message.trim(), uploadedUrls);

      // Reset form
      setMessage('');
      setFiles([]);
    } catch (err: any) {
      console.error('Delivery upload error:', err);
      setError(err.message || 'Failed to deliver work. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Deliver Your Work</h3>

      {/* Message */}
      <div className="mb-4">
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Delivery Message
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green"
          placeholder="Describe what you've delivered..."
        />
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attachments (optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.zip"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">Click to upload files</span>
            <span className="text-xs text-gray-500 mt-1">
              Images, PDFs, Documents, or ZIP files
            </span>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center">
                  <File className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-2 bg-brand-green text-white rounded-lg hover:bg-brand-green/90 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {uploading ? 'Uploading...' : 'Deliver Work'}
        </button>
      </div>
    </form>
  );
}

