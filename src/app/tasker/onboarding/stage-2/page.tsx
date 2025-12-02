'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import FileUpload from '@/components/FileUpload';
import { uploadFile, validateDocumentFile } from '@/lib/supabase-storage';
import { showToast } from '@/lib/toast';

export default function TaskerStage2Page() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [formData, setFormData] = useState({
    nicFrontFiles: [] as File[],
    nicBackFiles: [] as File[],
    policeReportFiles: [] as File[],
    addressProofFiles: [] as File[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has completed email verification
    const verifiedId = sessionStorage.getItem('verifiedTaskerId');
    
    if (!verifiedId) {
      router.push('/tasker/onboarding/stage-1');
      return;
    }
    
    setUserId(verifiedId);
  }, [router]);

  const handleFileChange = (field: keyof typeof formData, files: File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: files,
    }));

    // Clear error when user selects files
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // NIC front validation
    if (formData.nicFrontFiles.length === 0) {
      newErrors.nicFrontFiles = 'NIC front photo is required';
    } else {
      const validation = validateDocumentFile(formData.nicFrontFiles[0]);
      if (!validation.valid) {
        newErrors.nicFrontFiles = validation.error || 'Invalid file';
      }
    }

    // NIC back validation
    if (formData.nicBackFiles.length === 0) {
      newErrors.nicBackFiles = 'NIC back photo is required';
    } else {
      const validation = validateDocumentFile(formData.nicBackFiles[0]);
      if (!validation.valid) {
        newErrors.nicBackFiles = validation.error || 'Invalid file';
      }
    }

    // Police report validation (optional but recommended)
    if (formData.policeReportFiles.length > 0) {
      const validation = validateDocumentFile(formData.policeReportFiles[0]);
      if (!validation.valid) {
        newErrors.policeReportFiles = validation.error || 'Invalid file';
      }
    }

    // Address proof validation
    if (formData.addressProofFiles.length === 0) {
      newErrors.addressProofFiles = 'Address proof is required';
    } else {
      const validation = validateDocumentFile(formData.addressProofFiles[0]);
      if (!validation.valid) {
        newErrors.addressProofFiles = validation.error || 'Invalid file';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Upload NIC front
      const nicFrontResult = await uploadFile(
        formData.nicFrontFiles[0],
        'verifications',
        `${userId}/nic`
      );

      if (!nicFrontResult.success) {
        throw new Error('Failed to upload NIC front photo');
      }

      // Upload NIC back
      const nicBackResult = await uploadFile(
        formData.nicBackFiles[0],
        'verifications',
        `${userId}/nic`
      );

      if (!nicBackResult.success) {
        throw new Error('Failed to upload NIC back photo');
      }

      // Upload police report if provided
      let policeReportUrl = null;
      if (formData.policeReportFiles.length > 0) {
        const policeReportResult = await uploadFile(
          formData.policeReportFiles[0],
          'verifications',
          `${userId}/police`
        );

        if (!policeReportResult.success) {
          throw new Error('Failed to upload police report');
        }
        policeReportUrl = policeReportResult.url;
      }

      // Upload address proof
      const addressProofResult = await uploadFile(
        formData.addressProofFiles[0],
        'verifications',
        `${userId}/address`
      );

      if (!addressProofResult.success) {
        throw new Error('Failed to upload address proof');
      }

      // Save verification data to database
      const response = await fetch('/api/verifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          verifications: [
            {
              type: 'nic',
              documents: [nicFrontResult.url, nicBackResult.url],
            },
            ...(policeReportUrl ? [{
              type: 'police_report',
              documents: [policeReportUrl],
            }] : []),
            {
              type: 'address_proof',
              documents: [addressProofResult.url],
            },
          ],
        }),
      });

      if (response.ok) {
        // Show success message
        showToast.success('Documents uploaded successfully! Moving to next step...');
        
        // Store completion status
        sessionStorage.setItem('stage2Complete', 'true');
        
        // Redirect to Stage 3 after short delay
        setTimeout(() => {
          router.push('/tasker/onboarding/stage-3');
        }, 1500);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.message || 'Failed to save verification data' });
        showToast.error(errorData.message || 'Failed to save verification data');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Verification failed. Please try again.';
      setErrors({ submit: errorMessage });
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow skipping but mark as incomplete
    sessionStorage.setItem('stage2Complete', 'false');
    router.push('/tasker/onboarding/stage-3');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="EasyFinder"
              width={141}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Identity Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Stage 2 of 4: Verify Your Identity
          </p>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-brand-green rounded-full"></div>
              <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
              <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6 sm:p-8">
          {/* Info Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Why do we need this?</p>
                <p>
                  Identity verification helps build trust in our community. Your documents are
                  securely stored and reviewed by our team. This process typically takes 1-2
                  business days.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {errors.submit}
              </div>
            )}

            {/* NIC Front */}
            <FileUpload
              label="National Identity Card (Front)"
              accept="image/*,.pdf"
              maxSizeMB={10}
              multiple={false}
              required={true}
              onChange={(files) => handleFileChange('nicFrontFiles', files)}
              helperText="Upload a clear photo of the front of your NIC"
              error={errors.nicFrontFiles}
            />

            {/* NIC Back */}
            <FileUpload
              label="National Identity Card (Back)"
              accept="image/*,.pdf"
              maxSizeMB={10}
              multiple={false}
              required={true}
              onChange={(files) => handleFileChange('nicBackFiles', files)}
              helperText="Upload a clear photo of the back of your NIC"
              error={errors.nicBackFiles}
            />

            {/* Police Report */}
            <FileUpload
              label="Police Report (Recommended)"
              accept="image/*,.pdf"
              maxSizeMB={10}
              multiple={false}
              required={false}
              onChange={(files) => handleFileChange('policeReportFiles', files)}
              helperText="Upload your police clearance certificate. This increases your trust score and helps you get more tasks."
              error={errors.policeReportFiles}
            />

            {/* Address Proof */}
            <FileUpload
              label="Address Proof"
              accept="image/*,.pdf"
              maxSizeMB={10}
              multiple={false}
              required={true}
              onChange={(files) => handleFileChange('addressProofFiles', files)}
              helperText="Upload a utility bill, bank statement, or any official document showing your address (issued within last 3 months)"
              error={errors.addressProofFiles}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push('/tasker/onboarding/email-verify')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-green hover:bg-brand-green/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Uploading...' : 'Continue'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

