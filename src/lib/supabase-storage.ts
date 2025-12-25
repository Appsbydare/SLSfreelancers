import { supabase } from './supabase';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (e.g., 'verifications', 'profiles', 'portfolios')
 * @param folder - Optional folder path within the bucket
 * @returns Upload result with URL or error
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: string,
  folder?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file => uploadFile(file, bucket, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file within the bucket
 * @returns Success status
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Delete multiple files from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePaths - Array of file paths to delete
 * @returns Success status
 */
export async function deleteMultipleFiles(
  bucket: string,
  filePaths: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(filePaths);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Get public URL for a file
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file within the bucket
 * @returns Public URL
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Validate file size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Validation result
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 * @param file - The file to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate image file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5MB)
 * @returns Validation result
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 5
): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return validateFileSize(file, maxSizeMB);
}

/**
 * Validate document file
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB (default: 10MB)
 * @returns Validation result
 */
export function validateDocumentFile(
  file: File,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ];
  
  const typeValidation = validateFileType(file, allowedTypes);
  if (!typeValidation.valid) {
    return typeValidation;
  }
  
  return validateFileSize(file, maxSizeMB);
}

