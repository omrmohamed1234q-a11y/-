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
    let progressTimer: NodeJS.Timeout | null = null;
    let lastProgress = 0;
    let stuckCount = 0;
    
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
      
      // Monitor for stuck uploads
      progressTimer = setInterval(() => {
        if (lastProgress === 0) {
          stuckCount++;
          if (stuckCount > 10) { // 10 seconds stuck at 0%
            console.log('Upload appears stuck, canceling...');
            uploadTask.cancel();
            clearInterval(progressTimer);
            reject(new Error('STUCK_UPLOAD: الرفع متوقف عند 0%. جرب ملف أصغر أو تحقق من الاتصال'));
          }
        } else {
          stuckCount = 0; // Reset if progress is moving
        }
      }, 1000);
      
      // Overall timeout
      const overallTimeout = setTimeout(() => {
        console.log('Upload timeout reached, canceling...');
        uploadTask.cancel();
        clearInterval(progressTimer);
        reject(new Error('UPLOAD_TIMEOUT: انتهت مهلة الرفع. جرب ملف أصغر'));
      }, 60000); // 60 seconds total timeout
      
      // Set up upload event listeners
      uploadTask.on('state_changed',
        // Progress function
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          lastProgress = progress;
          console.log(`Upload is ${progress}% done - ${snapshot.bytesTransferred}/${snapshot.totalBytes} bytes`);
          
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
          if (progressTimer) clearInterval(progressTimer);
          clearTimeout(overallTimeout);
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
          if (progressTimer) clearInterval(progressTimer);
          clearTimeout(overallTimeout);
          
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
      if (progressTimer) clearInterval(progressTimer);
      console.error('Error initializing upload:', error);
      reject(new Error('فشل في بدء عملية الرفع'));
    }
  });
}

/**
 * Upload with automatic fallback - bypasses resumable upload that gets stuck
 */
export async function uploadWithFallback(
  file: File,
  folder: string = 'uploads',
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('Attempting upload with fallback for:', file.name);
  
  // Skip resumable upload entirely and go straight to simple upload
  console.log('Using simple upload method to avoid getting stuck...');
  
  // Import the debug upload function
  const { debugUpload } = await import('./firebase-debug');
  
  try {
    // Use debug upload method (simple and direct)
    if (onProgress) onProgress(10);
    const result = await debugUpload(file);
    if (onProgress) onProgress(100);
    return result;
  } catch (debugError) {
    console.warn('Debug upload failed, trying standard method:', debugError);
    
    // Fallback to the enhanced upload function
    const { uploadToFirebaseStorage } = await import('./firebase-storage');
    
    try {
      return await uploadToFirebaseStorage(file, folder, undefined, onProgress, 1);
    } catch (standardError) {
      console.error('Both upload methods failed:', standardError);
      throw new Error('فشل في رفع الملف بكلا الطريقتين. تحقق من الاتصال وإعدادات Firebase');
    }
  }
}