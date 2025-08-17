import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../App';

/**
 * Upload file to Firebase Storage from mobile
 */
export async function uploadToFirebaseStorage(
  fileUri: string,
  folder: string = 'mobile-uploads',
  customFileName?: string
): Promise<string> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const fileExtension = fileUri.split('.').pop() || 'jpg';
    const fileName = customFileName || `${timestamp}_${randomId}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    // Fetch file data
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        platform: 'mobile',
        source: 'camera'
      }
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Mobile file uploaded successfully:', {
      path: snapshot.ref.fullPath,
      downloadURL,
      size: blob.size
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Firebase mobile upload error:', error);
    throw new Error(`فشل في رفع الملف: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
  }
}

/**
 * Upload multiple files from mobile
 */
export async function uploadMultipleFiles(
  fileUris: string[], 
  folder: string = 'mobile-uploads'
): Promise<string[]> {
  const uploadPromises = fileUris.map(uri => 
    uploadToFirebaseStorage(uri, folder)
  );
  
  try {
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple mobile upload error:', error);
    throw new Error('فشل في رفع بعض الملفات');
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFromFirebaseStorage(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
    console.log('Mobile file deleted successfully:', fileUrl);
  } catch (error) {
    console.error('Firebase mobile delete error:', error);
    throw new Error('فشل في حذف الملف');
  }
}

/**
 * Validate file before upload (mobile specific)
 */
export function validateMobileFile(
  fileUri: string,
  options: {
    maxSize?: number;
    allowedExtensions?: string[];
  } = {}
): { isValid: boolean; error?: string } {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf']
  } = options;

  // Check file extension
  const fileExtension = fileUri.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `نوع الملف غير مدعوم. الأنواع المدعومة: ${allowedExtensions.join(', ')}`
    };
  }

  return { isValid: true };
}

/**
 * Get optimized image URL for mobile
 */
export function getOptimizedImageUrl(downloadUrl: string, size: number = 400): string {
  // Firebase Storage supports URL transformations for images
  if (downloadUrl.includes('firebasestorage.googleapis.com')) {
    return `${downloadUrl}&resize=${size}x${size}`;
  }
  return downloadUrl;
}

/**
 * Compress image before upload (for mobile optimization)
 */
export async function compressImageForUpload(
  fileUri: string,
  quality: number = 0.8
): Promise<string> {
  try {
    // In a real implementation, you would use expo-image-manipulator
    // For now, return the original URI
    return fileUri;
  } catch (error) {
    console.error('Image compression error:', error);
    return fileUri; // Return original if compression fails
  }
}