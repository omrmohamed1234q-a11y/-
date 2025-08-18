import { storage } from './firebase-storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Ultra-simple upload that bypasses all the complex logic
 * This is for debugging stuck uploads
 */
export async function debugUpload(file: File): Promise<string> {
  console.log('DEBUG: Starting ultra-simple upload for:', file.name);
  
  // Test basic Firebase connection first
  try {
    console.log('DEBUG: Testing Firebase connection...');
    const testRef = ref(storage, 'test-connection');
    console.log('DEBUG: Firebase connection test passed');
  } catch (error) {
    console.error('DEBUG: Firebase connection failed:', error);
    throw new Error('لا يمكن الاتصال بـ Firebase Storage');
  }
  
  // Generate simple filename
  const timestamp = Date.now();
  const fileName = `debug_${timestamp}.${file.name.split('.').pop()}`;
  const storageRef = ref(storage, `debug-uploads/${fileName}`);
  
  console.log('DEBUG: Uploading to:', storageRef.fullPath);
  console.log('DEBUG: File size:', file.size, 'bytes');
  console.log('DEBUG: File type:', file.type);
  
  try {
    // Simple upload with 30 second timeout
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('DEBUG_TIMEOUT')), 30000)
    );
    
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]) as any;
    console.log('DEBUG: Upload completed successfully');
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('DEBUG: Download URL:', downloadURL);
    
    return downloadURL;
  } catch (error: any) {
    console.error('DEBUG: Upload failed:', error);
    
    if (error.message === 'DEBUG_TIMEOUT') {
      throw new Error('انتهت مهلة الرفع البسيط. المشكلة في الاتصال أو Firebase');
    }
    
    throw new Error(`فشل الرفع البسيط: ${error.message}`);
  }
}

/**
 * Test function to diagnose Firebase issues
 */
export async function testFirebaseRules(): Promise<void> {
  console.log('Testing Firebase Storage Rules...');
  
  // Create a tiny test file
  const testContent = new Blob(['test'], { type: 'text/plain' });
  const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
  
  try {
    const url = await debugUpload(testFile);
    console.log('✅ Firebase rules test PASSED. Download URL:', url);
  } catch (error) {
    console.error('❌ Firebase rules test FAILED:', error);
    throw error;
  }
}