// Hybrid Upload Service - Cloudinary Primary, Firebase Backup
import { uploadToCloudinary, testCloudinaryConnection } from './cloudinary';
import { uploadToFirebaseStorage } from './firebase-storage';

export interface UploadResult {
  success: boolean;
  url?: string;
  downloadUrl?: string;
  previewUrl?: string;
  provider?: 'cloudinary' | 'firebase';
  error?: string;
  fileId?: string;
}

// Upload file with automatic fallback
export async function uploadFile(file: File): Promise<UploadResult> {
  console.log(`📤 Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  // Try Cloudinary first (recommended for PDFs)
  try {
    const cloudinaryTest = await testCloudinaryConnection();
    if (cloudinaryTest.success) {
      console.log('🟡 Using Cloudinary for upload...');
      const result = await uploadToCloudinary(file);
      
      if (result.success) {
        console.log('✅ Cloudinary upload successful!');
        return {
          success: true,
          url: result.url!,
          downloadUrl: result.url!,
          previewUrl: result.previewUrl,
          provider: 'cloudinary',
          fileId: result.publicId
        };
      } else {
        console.warn('⚠️ Cloudinary upload failed, trying Firebase...');
      }
    } else {
      console.log('🟡 Cloudinary not configured, using Firebase...');
    }
  } catch (error) {
    console.warn('⚠️ Cloudinary error, falling back to Firebase:', error);
  }

  // Fallback to Firebase Storage
  try {
    console.log('🔥 Using Firebase Storage for upload...');
    const downloadURL = await uploadToFirebaseStorage(file, 'uploads');
    
    console.log('✅ Firebase upload successful!');
    return {
      success: true,
      url: downloadURL,
      downloadUrl: downloadURL,
      provider: 'firebase',
      fileId: file.name
    };
  } catch (error) {
    console.error('❌ Both upload services failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
      provider: undefined
    };
  }
}

// Check upload service status
export async function checkUploadServiceStatus(): Promise<{
  cloudinary: { available: boolean; message: string };
  firebase: { available: boolean; message: string };
  recommended: 'cloudinary' | 'firebase' | 'none';
}> {
  console.log('🔍 Checking upload services status...');

  // Test Cloudinary
  let cloudinaryStatus;
  try {
    cloudinaryStatus = await testCloudinaryConnection();
  } catch (error) {
    cloudinaryStatus = { 
      success: false, 
      message: error instanceof Error ? error.message : 'Connection failed' 
    };
  }

  // Test Firebase (simple check)
  let firebaseStatus;
  try {
    const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_PROJECT_ID && 
                              import.meta.env.VITE_FIREBASE_API_KEY;
    firebaseStatus = {
      success: hasFirebaseConfig,
      message: hasFirebaseConfig ? 'Firebase configured' : 'Firebase not configured'
    };
  } catch (error) {
    firebaseStatus = { 
      success: false, 
      message: error instanceof Error ? error.message : 'Configuration check failed' 
    };
  }

  // Determine recommended service
  let recommended: 'cloudinary' | 'firebase' | 'none';
  if (cloudinaryStatus.success) {
    recommended = 'cloudinary';
  } else if (firebaseStatus.success) {
    recommended = 'firebase';
  } else {
    recommended = 'none';
  }

  const status = {
    cloudinary: {
      available: cloudinaryStatus.success,
      message: cloudinaryStatus.message
    },
    firebase: {
      available: firebaseStatus.success,
      message: firebaseStatus.message
    },
    recommended
  };

  console.log('Upload services status:', status);
  return status;
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