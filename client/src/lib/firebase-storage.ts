import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase config check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const auth = getAuth(app);

/**
 * Upload file to Firebase Storage
 */
export async function uploadToFirebaseStorage(
  file: File, 
  folder: string = 'uploads',
  customFileName?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = customFileName || `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Track upload progress
    if (onProgress) {
      onProgress(0);
    }
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString()
      }
    });
    
    // Complete progress
    if (onProgress) {
      onProgress(100);
    }
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('File uploaded successfully:', {
      path: snapshot.ref.fullPath,
      downloadURL,
      size: file.size
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase upload error:', error);
    
    // Check if Firebase Storage is properly configured
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
      throw new Error('Firebase configuration is missing required credentials');
    }
    
    // Check specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('storage/unauthorized')) {
        throw new Error('لا توجد صلاحيات للرفع. تحقق من إعدادات Firebase Storage');
      } else if (error.message.includes('storage/quota-exceeded')) {
        throw new Error('تم تجاوز المساحة المسموحة في Firebase Storage');
      } else if (error.message.includes('network')) {
        throw new Error('مشكلة في الاتصال. تحقق من الإنترنت وحاول مرة أخرى');
      }
      throw new Error(`خطأ في رفع الملف: ${error.message}`);
    }
    
    throw new Error('فشل في رفع الملف لسبب غير معروف');
  }
}

/**
 * Upload multiple files to Firebase Storage
 */
export async function uploadMultipleToFirebase(
  files: FileList | File[], 
  folder: string = 'uploads'
): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => 
    uploadToFirebaseStorage(file, folder)
  );
  
  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw new Error('فشل في رفع بعض الملفات');
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFromFirebase(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log('File deleted successfully:', fileUrl);
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw new Error('فشل في حذف الملف');
  }
}

/**
 * Get file metadata from Firebase Storage
 */
export async function getFileMetadata(fileUrl: string) {
  try {
    const fileRef = ref(storage, fileUrl);
    const metadata = await getMetadata(fileRef);
    return metadata;
  } catch (error) {
    console.error('Get metadata error:', error);
    throw new Error('فشل في الحصول على معلومات الملف');
  }
}

/**
 * Generate a preview URL for images
 */
export function getImagePreviewUrl(downloadUrl: string, size: number = 200): string {
  // Firebase Storage supports URL transformations for images
  if (downloadUrl.includes('firebasestorage.googleapis.com')) {
    return `${downloadUrl}&resize=${size}x${size}`;
  }
  return downloadUrl;
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File, 
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/*', 'application/pdf', 'application/msword'],
    allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `حجم الملف كبير جداً. الحد الأقصى ${Math.round(maxSize / (1024 * 1024))} ميجابايت`
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedExtensions.join(', ')}`
    };
  }

  // Check MIME type
  const isTypeAllowed = allowedTypes.some(type => {
    if (type.endsWith('*')) {
      return file.type.startsWith(type.replace('*', ''));
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    return {
      isValid: false,
      error: 'نوع الملف غير مدعوم'
    };
  }

  return { isValid: true };
}

// Export configuration for easy access
export { firebaseConfig };