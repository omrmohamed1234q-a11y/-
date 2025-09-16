// Primary Cloudinary Upload Service
// Integrated with user account API for tracking and management
import { uploadToCloudinary, testCloudinaryConnection } from './cloudinary';
import { apiRequest, getAuthHeaders } from './queryClient'; // 🔒 SECURITY: Import auth headers

export interface UploadResult {
  success: boolean;
  url?: string;
  downloadUrl?: string;
  previewUrl?: string;
  provider?: 'cloudinary' | 'firebase' | 'google_drive';
  error?: string;
  fileId?: string;
  folderLink?: string;
}

// Upload file using Cloudinary with account integration
export async function uploadFile(file: File): Promise<UploadResult> {
  console.log(`📤 Uploading to Cloudinary: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  try {
    // Test Cloudinary connection first
    const cloudinaryTest = await testCloudinaryConnection();
    if (!cloudinaryTest.success) {
      throw new Error(`Cloudinary not available: ${cloudinaryTest.message}`);
    }

    console.log('☁️ Uploading to Cloudinary...');
    const result = await uploadToCloudinary(file);
    
    if (result.success) {
      console.log('✅ Cloudinary upload successful!');
      const uploadResult = {
        success: true,
        url: result.url!,
        downloadUrl: result.url!,
        previewUrl: result.previewUrl,
        provider: 'cloudinary' as const,
        fileId: result.publicId
      };
      
      // Notify server about successful upload
      await notifyServerUpload(file, uploadResult);
      return uploadResult;
    } else {
      throw new Error(result.error || 'Cloudinary upload failed');
    }
  } catch (error) {
    console.error('❌ Cloudinary upload failed:', error);
    
    let errorMessage = 'Cloudinary upload failed';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
        errorMessage = 'Cloudinary upload timed out. Please try again with a smaller file.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      provider: undefined
    };
  }
}

// 🚀 OPTIMIZED: Fast upload with FormData instead of base64
export async function uploadFileToGoogleDrive(file: File, printSettings?: any): Promise<UploadResult> {
  console.log(`🚀 Cloud Priority Upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  try {
    console.log('📁 Uploading to Cloud Storage (Primary)...');
    
    // 🚀 PERFORMANCE: Use FormData instead of base64 conversion
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);
    
    if (printSettings) {
      formData.append('printSettings', JSON.stringify(printSettings));
    }

    // Try to get user info for better folder organization
    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      if (userInfo.id) {
        formData.append('customerName', userInfo.displayName || userInfo.fullName || userInfo.id);
      }
    } catch (error) {
      console.log('⚠️ Could not get user info for folder naming, using default');
    }

    // 🚀 PERFORMANCE: FormData upload with authentication and error handling
    // Note: apiRequest doesn't support FormData yet, using fetch with auth headers
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/google-drive-primary', {
      method: 'POST',
      headers: {
        ...authHeaders, // 🔒 SECURITY: Include authentication headers
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
      credentials: 'include',
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cloud upload successful! Cost savings activated 💰');
      
      const uploadResult: UploadResult = {
        success: true,
        url: result.folderLink || result.url, // Use folder link for admin, file link for direct access
        downloadUrl: result.directDownloadLink || result.url,
        previewUrl: result.webViewLink,
        provider: 'google_drive' as const,
        fileId: result.fileId,
        folderLink: result.folderLink
      };
      
      // Notify server about successful upload
      await notifyServerUpload(file, uploadResult);
      return uploadResult;
    } else {
      throw new Error(result.error || 'Cloud upload failed');
    }
  } catch (error) {
    console.error('❌ Cloud upload failed:', error);
    
    let errorMessage = 'Cloud upload failed';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
        errorMessage = 'Upload timed out - the file might still be processing. Please check your cloud storage.';
      } else if (error.message.includes('AbortError')) {
        errorMessage = 'Upload was cancelled due to timeout. Please try with a smaller file.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      provider: undefined
    };
  }
}

// 🚀 REMOVED: fileToBuffer function - no longer needed with FormData approach

// Notify server about file upload for account integration
async function notifyServerUpload(file: File, result: UploadResult): Promise<void> {
  try {
    console.log('🔔 Notifying server about upload...');
    
    const uploadData = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadProvider: result.provider,
      fileUrl: result.url,
    };

    const response = await apiRequest('POST', '/api/upload-file', uploadData);
    const serverResult = await response.json();
    
    if (serverResult.success) {
      console.log('✅ Server notified about upload:', serverResult);
    } else {
      console.warn('⚠️ Server notification failed:', serverResult.error);
    }
  } catch (error) {
    console.error('❌ Failed to notify server about upload:', error);
    // Don't throw error - upload was successful, just tracking failed
  }
}

// Check Cloudinary service status
export async function checkUploadServiceStatus(): Promise<{
  cloudinary: { available: boolean; message: string };
  recommended: 'cloudinary' | 'none';
}> {
  console.log('🔍 Checking Cloudinary status...');

  // Test Cloudinary connection
  let cloudinaryStatus;
  try {
    cloudinaryStatus = await testCloudinaryConnection();
  } catch (error) {
    cloudinaryStatus = { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection failed' 
    };
  }

  return {
    cloudinary: {
      available: cloudinaryStatus.success,
      message: cloudinaryStatus.message
    },
    recommended: cloudinaryStatus.success ? 'cloudinary' : 'none'
  };
}

// Get file preview URL based on provider
export function getFilePreviewUrl(fileUrl: string, provider: 'cloudinary' | 'firebase'): string {
  if (provider === 'cloudinary') {
    // Cloudinary URLs already optimized
    return fileUrl;
  } else {
    // Firebase URLs are direct download links
    return fileUrl;
  }
}

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, FILE_TYPE_ERRORS, isValidFileType } from '@shared/file-types';

// Validate file for upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). ${FILE_TYPE_ERRORS.FILE_TOO_LARGE}`
    };
  }

  // Type check using shared validation
  if (!isValidFileType(file)) {
    return {
      valid: false,
      error: `${FILE_TYPE_ERRORS.INVALID_TYPE}. نوع الملف المرسل: ${file.type}`
    };
  }

  return { valid: true };
}

// Debug tools for browser console
if (typeof window !== 'undefined') {
  (window as any).checkUploadServiceStatus = checkUploadServiceStatus;
  (window as any).testUploadService = async function() {
    console.log('🔧 Testing Upload Service...');
    
    const status = await checkUploadServiceStatus();
    console.log('Upload Service Status:', status);
    
    // Test file validation
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const validation = validateFile(testFile);
    console.log('File validation test:', validation);
    
    return {
      status,
      validation,
      recommendation: status.recommended
    };
  };
}