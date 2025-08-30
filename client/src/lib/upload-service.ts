// Primary Cloudinary Upload Service
// Integrated with user account API for tracking and management
import { uploadToCloudinary, testCloudinaryConnection } from './cloudinary';
import { apiRequest } from './queryClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  downloadUrl?: string;
  previewUrl?: string;
  provider?: 'cloudinary' | 'firebase';
  error?: string;
  fileId?: string;
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      provider: undefined
    };
  }
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