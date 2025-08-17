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
    console.log('Starting Firebase upload for:', file.name, 'Size:', file.size);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split('.').pop();
    const fileName = customFileName || `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${fileName}`);
    console.log('Storage ref created:', storageRef.fullPath);
    
    // Track upload progress
    if (onProgress) {
      onProgress(10);
    }
    
    // Upload file with timeout
    const uploadPromise = uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString()
      }
    });
    
    // Set timeout for upload
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('رفع الملف استغرق وقتاً طويلاً. تحقق من إعدادات Firebase Storage Rules')), 30000)
    );
    
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    console.log('Upload completed:', snapshot.ref.fullPath);
    
    // Complete progress
    if (onProgress) {
      onProgress(90);
    }
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    if (onProgress) {
      onProgress(100);
    }
    
    console.log('File uploaded successfully:', {
      path: snapshot.ref.fullPath,
      downloadURL,
      size: file.size
    });
    
    return downloadURL;
  } catch (error: any) {
    console.error('Firebase upload error:', error);
    
    let errorMessage = 'خطأ في رفع الملف';
    if (error?.code === 'storage/unauthorized') {
      errorMessage = 'غير مصرح. تحقق من Firebase Storage Rules';
    } else if (error?.code === 'storage/retry-limit-exceeded') {
      errorMessage = 'انتهت مهلة الرفع. تحقق من اتصال الإنترنت أو Firebase Rules';
    } else if (error?.message?.includes('وقتاً طويلاً')) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = `فشل الرفع: ${error.message}`;
    }
    
    throw new Error(errorMessage);
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