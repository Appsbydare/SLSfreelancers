'use client';

import { useState, useEffect } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { GigRequirement } from '@/types';
import { uploadFile } from '@/lib/supabase-storage';

interface RequirementsFormProps {
  requirements: GigRequirement[];
  userId: string;
  onSubmit: (responses: Record<string, any>) => void;
  initialResponses?: Record<string, any>;
}

export default function RequirementsForm({
  requirements,
  userId,
  onSubmit,
  initialResponses = {},
}: RequirementsFormProps) {
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const handleTextChange = (reqId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [reqId]: value }));
    if (errors[reqId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[reqId];
        return newErrors;
      });
    }
  };

  const handleChoiceChange = (reqId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [reqId]: value }));
    if (errors[reqId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[reqId];
        return newErrors;
      });
    }
  };

  const handleMultipleChoiceChange = (reqId: string, value: string, checked: boolean) => {
    setResponses((prev) => {
      const current = Array.isArray(prev[reqId]) ? prev[reqId] : [];
      if (checked) {
        return { ...prev, [reqId]: [...current, value] };
      } else {
        return { ...prev, [reqId]: current.filter((v: string) => v !== value) };
      }
    });
    if (errors[reqId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[reqId];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (reqId: string, file: File) => {
    setUploading((prev) => ({ ...prev, [reqId]: true }));
    try {
      const result = await uploadFile(file, 'requirements', userId);
      if (result.success && result.url) {
        setResponses((prev) => ({ ...prev, [reqId]: result.url }));
        if (errors[reqId]) {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[reqId];
            return newErrors;
          });
        }
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [reqId]: 'Failed to upload file' }));
    } finally {
      setUploading((prev) => ({ ...prev, [reqId]: false }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    requirements.forEach((req) => {
      if (req.isRequired) {
        const response = responses[req.id];
        if (!response || (Array.isArray(response) && response.length === 0) || 
            (typeof response === 'string' && !response.trim())) {
          newErrors[req.id] = 'This field is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(responses);
    }
  };

  if (requirements.length === 0) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-1">
          Seller Requirements
        </h3>
        <p className="text-sm text-blue-700">
          Please provide the following information to help the seller complete your order.
        </p>
      </div>

      {requirements.map((req) => (
        <div key={req.id} className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {req.question}
            {req.isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>

          {/* Text Input */}
          {req.answerType === 'text' && (
            <textarea
              value={responses[req.id] || ''}
              onChange={(e) => handleTextChange(req.id, e.target.value)}
              rows={3}
              className={`w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-green ${
                errors[req.id] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your answer..."
            />
          )}

          {/* Single Choice (Radio) */}
          {req.answerType === 'choice' && req.options && (
            <div className="space-y-2">
              {req.options.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    name={req.id}
                    value={option}
                    checked={responses[req.id] === option}
                    onChange={(e) => handleChoiceChange(req.id, e.target.value)}
                    className="h-4 w-4 text-brand-green focus:ring-brand-green"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* Multiple Choice (Checkbox) */}
          {req.answerType === 'multiple_choice' && req.options && (
            <div className="space-y-2">
              {req.options.map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="checkbox"
                    value={option}
                    checked={
                      Array.isArray(responses[req.id]) && responses[req.id].includes(option)
                    }
                    onChange={(e) =>
                      handleMultipleChoiceChange(req.id, option, e.target.checked)
                    }
                    className="h-4 w-4 text-brand-green focus:ring-brand-green rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {/* File Upload */}
          {req.answerType === 'file' && (
            <div>
              {!responses[req.id] ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    id={`file-${req.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(req.id, file);
                      }
                    }}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <label
                    htmlFor={`file-${req.id}`}
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploading[req.id] ? (
                      <div className="text-sm text-gray-600">Uploading...</div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload</span>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <span className="text-sm text-gray-700">File uploaded</span>
                  <button
                    type="button"
                    onClick={() => handleTextChange(req.id, '')}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errors[req.id] && (
            <div className="flex items-center text-red-600 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors[req.id]}
            </div>
          )}
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-brand-green text-white py-3 px-6 rounded-lg hover:bg-brand-green/90 font-semibold"
      >
        Continue to Checkout
      </button>
    </form>
  );
}

