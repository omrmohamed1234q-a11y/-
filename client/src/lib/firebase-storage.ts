import { initializeApp, getApps, getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase config check:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasProjectId: !!firebaseConfig.projectId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase only if config is complete
let app: any = null;
let storage: any = null;
let auth: any = null;

if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    storage = getStorage(app);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
  }
}

export { storage, auth };

/**
 * Upload file to Firebase Storage with retry logic
 */
export async function uploadToFirebaseStorage(
  file: File, 
  folder: string = 'uploads',
  customFileName?: string,
  onProgress?: (progress: number) => void,
  maxRetries: number = 3
): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Please check Firebase configuration.');
  }

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Starting Firebase upload attempt ${attempt}/${maxRetries} for:`, file.name, 'Size:', file.size);
      
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
        onProgress(10 + (attempt - 1) * 5);
      }
      
      // Test Firebase connection first
      try {
        await fetch(`https://firebasestorage.googleapis.com/v0/b/${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com/o`, {
          method: 'GET',
          mode: 'cors'
        });
      } catch (connectionError) {
        throw new Error('فشل في الاتصال بـ Firebase Storage. تحقق من الإنترنت');
      }
      
      // Upload file with dynamic timeout based on file size
      const timeoutMs = Math.max(30000, file.size / 1024 * 10); // 10ms per KB, minimum 30s
      console.log(`Upload timeout set to: ${timeoutMs}ms for ${file.size} bytes`);
      
      const uploadPromise = uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          attempt: attempt.toString()
        }
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`TIMEOUT_ATTEMPT_${attempt}`)), timeoutMs)
      );
      
      const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
      console.log('Upload completed:', snapshot.ref.fullPath);
      
      // Complete progress
      if (onProgress) {
        onProgress(80 + attempt * 5);
      }
      
      // Get download URL with timeout
      const urlTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('DOWNLOAD_URL_TIMEOUT')), 15000)
      );
      
      const downloadURL = await Promise.race([
        getDownloadURL(snapshot.ref),
        urlTimeoutPromise
      ]) as string;
      
      console.log('Download URL obtained:', downloadURL);
      
      if (onProgress) {
        onProgress(100);
      }
      
      console.log('File uploaded successfully:', {
        path: snapshot.ref.fullPath,
        downloadURL,
        size: file.size,
        attempt
      });
      
      return downloadURL;
      
    } catch (error: any) {
      lastError = error;
      console.error(`Firebase upload attempt ${attempt} failed:`, error);
      
      // If it's the last attempt, don't retry
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // All attempts failed, throw comprehensive error
  let errorMessage = 'فشل في رفع الملف بعد عدة محاولات';
  
  if (lastError?.code === 'storage/unauthorized') {
    errorMessage = 'غير مصرح. تحقق من إعدادات Firebase Storage Rules';
  } else if (lastError?.code === 'storage/retry-limit-exceeded') {
    errorMessage = 'تم تجاوز حد المحاولات. تحقق من الاتصال';
  } else if (lastError?.message?.includes('TIMEOUT_ATTEMPT')) {
    errorMessage = `انتهت مهلة الرفع بعد ${maxRetries} محاولات. الملف قد يكون كبيراً جداً أو الاتصال بطيء`;
  } else if (lastError?.message?.includes('Firebase Storage')) {
    errorMessage = 'مشكلة في إعدادات Firebase Storage. تحقق من القواعد';
  } else if (lastError?.message?.includes('الاتصال')) {
    errorMessage = lastError.message;
  } else if (lastError instanceof Error) {
    errorMessage = `خطأ غير متوقع: ${lastError.message}`;
  }
  
  throw new Error(errorMessage);
}

/**
 * Upload multiple files to Firebase Storage
 */
export async function uploadMultipleToFirebase(
  files: FileList | File[], 
  folder: string = 'uploads'
): Promise<string[]> {
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Please check Firebase configuration.');
  }
  
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
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Please check Firebase configuration.');
  }
  
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
  if (!storage) {
    throw new Error('Firebase Storage not initialized. Please check Firebase configuration.');
  }
  
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

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, FILE_TYPE_ERRORS, isValidFileType, isValidFileExtension } from '@shared/file-types';

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
    maxSize = MAX_FILE_SIZE,
    allowedTypes = ALLOWED_FILE_TYPES.PICKER_TYPES,
    allowedExtensions = ALLOWED_FILE_TYPES.EXTENSIONS
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: FILE_TYPE_ERRORS.FILE_TOO_LARGE
    };
  }

  // Check file extension using shared validation
  if (!isValidFileExtension(file.name)) {
    return {
      isValid: false,
      error: FILE_TYPE_ERRORS.INVALID_TYPE
    };
  }

  // Check MIME type using shared validation
  if (!isValidFileType(file)) {
    return {
      isValid: false,
      error: FILE_TYPE_ERRORS.INVALID_TYPE
    };
  }

  return { isValid: true };
}

// Export configuration for easy access
export { firebaseConfig };

// Debug and testing functions
(window as any).testFirebaseConnection = async function() {
  if (!firebaseConfig.projectId) {
    console.log('❌ Firebase Project ID not set');
    return false;
  }
  
  try {
    const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.projectId}.appspot.com/o`, {
      method: 'GET',
      mode: 'cors'
    });
    console.log('✅ Firebase Storage connection successful!', response.status);
    return response.ok;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

(window as any).checkFirebaseConfig = function() {
  console.log('Firebase Configuration Status:');
  console.log('API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
  console.log('Project ID:', firebaseConfig.projectId ? `✅ ${firebaseConfig.projectId}` : '❌ Missing');
  console.log('App ID:', firebaseConfig.appId ? '✅ Set' : '❌ Missing');
  console.log('Storage:', storage ? '✅ Initialized' : '❌ Not initialized');
  return {
    hasApiKey: !!firebaseConfig.apiKey,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
    storageInitialized: !!storage
  };
};

(window as any).runFirebaseHealthCheck = async function() {
  console.log('🔥 Running Firebase Health Check...');
  const config = (window as any).checkFirebaseConfig();
  
  if (!config.hasApiKey || !config.hasProjectId || !config.hasAppId) {
    console.log('❌ Firebase configuration incomplete');
    return false;
  }
  
  return await (window as any).testFirebaseConnection();
};

console.log('🔥 Firebase debug tools loaded!');
console.log('Available commands:');
console.log('- testFirebaseConnection()');
console.log('- checkFirebaseConfig()');
console.log('- runFirebaseHealthCheck()');