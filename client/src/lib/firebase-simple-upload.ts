import { storage } from './firebase-storage';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Simple Firebase upload with resumable uploads and progress tracking
 */
export async function simpleFirebaseUpload(
  file: File,
  folder: string = 'simple-uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomId}.${fileExtension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `${folder}/${fileName}`);
      console.log('Simple upload - Storage ref created:', storageRef.fullPath);
      
      // Create resumable upload task
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          size: file.size.toString(),
          method: 'resumable'
        }
      });
      
      // Set up upload event listeners
      uploadTask.on('state_changed',
        // Progress function
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
          if (onProgress) {
            onProgress(progress);
          }
          
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
          }
        },
        // Error function
        (error) => {
          console.error('Simple upload error:', error);
          let errorMessage = 'فشل في رفع الملف';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'غير مصرح. تحقق من إعدادات Firebase Storage Rules';
              break;
            case 'storage/canceled':
              errorMessage = 'تم إلغاء رفع الملف';
              break;
            case 'storage/unknown':
              errorMessage = 'خطأ غير معروف في الرفع';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = 'تم تجاوز حد المحاولات. تحقق من الاتصال';
              break;
            default:
              errorMessage = `خطأ في الرفع: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        },
        // Complete function
        async () => {
          try {
            console.log('Upload completed, getting download URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('Download URL obtained:', downloadURL);
            resolve(downloadURL);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            reject(new Error('فشل في الحصول على رابط الملف'));
          }
        }
      );
      
    } catch (error) {
      console.error('Error initializing upload:', error);
      reject(new Error('فشل في بدء عملية الرفع'));
    }
  });
}

/**
 * Upload with automatic fallback
 */
export async function uploadWithFallback(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('Attempting upload with fallback for:', file.name);
  
  try {
    // Try resumable upload first (better for large files and slow connections)
    console.log('Trying resumable upload...');
    return await simpleFirebaseUpload(file, folder, onProgress);
  } catch (error) {
    console.warn('Resumable upload failed, trying standard method:', error);
    
    // Import the standard upload function
    const { uploadToFirebaseStorage } = await import('./firebase-storage');
    
    try {
      // Try standard upload with single retry
      return await uploadToFirebaseStorage(file, folder, undefined, onProgress, 1);
    } catch (standardError) {
      console.error('Both upload methods failed:', standardError);
      throw new Error('فشل في رفع الملف بكلا الطريقتين. تحقق من الاتصال وإعدادات Firebase');
    }
  }
}