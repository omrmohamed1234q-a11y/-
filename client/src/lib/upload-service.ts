// Primary Cloudinary Upload Service
// Integrated with user account API for tracking and management
import { uploadToCloudinary, testCloudinaryConnection } from './cloudinary';
import { apiRequest } from './queryClient';

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

// Google Drive Primary Upload for /print page - Cost Optimization
export async function uploadFileToGoogleDrive(file: File, printSettings?: any): Promise<UploadResult> {
  console.log(`🚀 Google Drive Priority Upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  try {
    // Convert file to base64 for server upload
    const fileBuffer = await fileToBuffer(file);
    
    console.log('📁 Uploading to Google Drive (Primary)...');
    
    // Add customer information from user context if available
    let uploadData = {
      fileName: file.name,
      fileBuffer: fileBuffer,
      mimeType: file.type,
      printSettings: printSettings
    };

    // Try to get user info for better folder organization
    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      if (userInfo.id) {
        uploadData = {
          ...uploadData,
          customerName: userInfo.displayName || userInfo.fullName || userInfo.id
        };
      }
    } catch (error) {
      console.log('⚠️ Could not get user info for folder naming, using default');
    }

    const response = await apiRequest('POST', '/api/upload/google-drive-primary', uploadData);

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Google Drive upload successful! Cost savings activated 💰');
      
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
      throw new Error(result.error || 'Google Drive upload failed');
    }
  } catch (error) {
    console.error('❌ Google Drive upload failed:', error);
    
    let errorMessage = 'Google Drive upload failed';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
        errorMessage = 'Upload timed out - the file might still be processing. Please check your Google Drive.';
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

// Helper function to convert File to base64 buffer
async function fileToBuffer(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix and get base64 string
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

// Validate file for upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Size check (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). الحد الأقصى 50MB`
    };
  }

  // Type check
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم: ${file.type}`
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
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const validation = validateFile(testFile);
    console.log('File validation test:', validation);
    
    return {
      status,
      validation,
      recommendation: status.recommended
    };
  };
}