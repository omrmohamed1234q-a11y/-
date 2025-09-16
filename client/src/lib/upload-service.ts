// Primary Cloudinary Upload Service
// Integrated with user account API for tracking and management
import { uploadToCloudinary, testCloudinaryConnection } from './cloudinary';
import { apiRequest, getAuthHeaders } from './queryClient'; // 🔒 SECURITY: Import auth headers

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

// 🚀 CHUNKED UPLOAD: Interfaces for high-speed parallel upload
export interface ChunkUploadProgress {
  chunkIndex: number;
  totalChunks: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  retryAttempt?: number; // 🔄 RECOVERY: Track retry attempts
  failedChunks?: number[]; // 🔄 RECOVERY: List of failed chunk indices
}

export interface ChunkedUploadResult extends UploadResult {
  chunks?: number;
  uploadTime?: number;
  averageSpeed?: string;
  retryAttempts?: number; // 🔄 RECOVERY: Number of retry attempts needed
  failedChunks?: number[]; // 🔄 RECOVERY: Final failed chunks (if any)
  recoveredChunks?: number; // 🔄 RECOVERY: Number of chunks that were recovered
}

export interface ChunkInfo {
  index: number;
  size: number;
  start: number;
  end: number;
  data: Blob;
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

// 🚀 OPTIMIZED: Fast upload with FormData instead of base64
export async function uploadFileToGoogleDrive(file: File, printSettings?: any): Promise<UploadResult> {
  console.log(`🚀 Cloud Priority Upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  try {
    console.log('📁 Uploading to Cloud Storage (Primary)...');
    
    // 🚀 PERFORMANCE: Use FormData instead of base64 conversion
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('mimeType', file.type);
    
    if (printSettings) {
      formData.append('printSettings', JSON.stringify(printSettings));
    }

    // Try to get user info for better folder organization
    try {
      const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
      if (userInfo.id) {
        formData.append('customerName', userInfo.displayName || userInfo.fullName || userInfo.id);
      }
    } catch (error) {
      console.log('⚠️ Could not get user info for folder naming, using default');
    }

    // 🚀 PERFORMANCE: FormData upload with authentication and error handling
    // Note: apiRequest doesn't support FormData yet, using fetch with auth headers
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/google-drive-primary', {
      method: 'POST',
      headers: {
        ...authHeaders, // 🔒 SECURITY: Include authentication headers
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData,
      credentials: 'include',
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Cloud upload successful! Cost savings activated 💰');
      
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
      throw new Error(result.error || 'Cloud upload failed');
    }
  } catch (error) {
    console.error('❌ Cloud upload failed:', error);
    
    let errorMessage = 'Cloud upload failed';
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('TimeoutError')) {
        errorMessage = 'Upload timed out - the file might still be processing. Please check your cloud storage.';
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

// 🚀 CHUNKED UPLOAD: Constants and utility functions
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks for optimal speed
const MAX_PARALLEL_CHUNKS = 3; // Prevent overwhelming the server
const CHUNK_TIMEOUT = 30000; // 30 seconds per chunk

// 🚀 CHUNKED UPLOAD: Split file into optimized chunks
function createChunks(file: File): ChunkInfo[] {
  const chunks: ChunkInfo[] = [];
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunkData = file.slice(start, end);
    
    chunks.push({
      index: i,
      size: end - start,
      start,
      end,
      data: chunkData
    });
  }
  
  console.log(`📊 Created ${totalChunks} chunks for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  return chunks;
}

// 🚀 CHUNKED UPLOAD: Upload single chunk with retry logic (for standard use)
async function uploadChunk(
  chunk: ChunkInfo, 
  sessionId: string, 
  fileName: string,
  totalChunks: number,
  onProgress?: (progress: ChunkUploadProgress) => void
): Promise<boolean> {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const formData = new FormData();
      formData.append('chunk', chunk.data);
      formData.append('chunkIndex', chunk.index.toString());
      formData.append('totalChunks', totalChunks.toString());
      formData.append('sessionId', sessionId);
      formData.append('fileName', fileName);
      
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/upload/chunk', {
        method: 'POST',
        headers: {
          ...authHeaders,
          'X-Request-Timeout': CHUNK_TIMEOUT.toString()
        },
        body: formData,
        signal: AbortSignal.timeout(CHUNK_TIMEOUT)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update progress
          onProgress?.({
            chunkIndex: chunk.index,
            totalChunks,
            uploadedBytes: chunk.size,
            totalBytes: chunk.size * totalChunks, 
            percentage: ((chunk.index + 1) / totalChunks) * 100
          });
          
          console.log(`✅ Chunk ${chunk.index + 1}/${totalChunks} uploaded successfully`);
          return true;
        }
      }
      
      throw new Error(`Chunk ${chunk.index} upload failed: ${response.status}`);
      
    } catch (error) {
      attempt++;
      console.warn(`⚠️ Chunk ${chunk.index} attempt ${attempt} failed:`, error);
      
      if (attempt >= maxRetries) {
        throw new Error(`Chunk ${chunk.index} failed after ${maxRetries} attempts`);
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return false;
}

// 🔧 FIX: Simplified chunk upload without internal retries (for recovery system)
async function uploadChunkSimple(
  chunk: ChunkInfo, 
  sessionId: string, 
  fileName: string,
  totalChunks: number
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('chunk', chunk.data);
    formData.append('chunkIndex', chunk.index.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('sessionId', sessionId);
    formData.append('fileName', fileName);
    
    const authHeaders = await getAuthHeaders();
    const response = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'X-Request-Timeout': CHUNK_TIMEOUT.toString()
      },
      body: formData,
      signal: AbortSignal.timeout(CHUNK_TIMEOUT)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        console.log(`✅ Chunk ${chunk.index + 1}/${totalChunks} uploaded (simple)`);
        return true;
      }
    }
    
    throw new Error(`Chunk ${chunk.index} upload failed: ${response.status}`);
    
  } catch (error) {
    console.warn(`⚠️ Chunk ${chunk.index} failed (simple):`, error);
    return false;
  }
}

// 🔄 RECOVERY: Enhanced chunked upload with automatic retry and recovery
export async function uploadFileWithChunks(
  file: File, 
  printSettings?: any,
  onProgress?: (progress: ChunkUploadProgress) => void
): Promise<ChunkedUploadResult> {
  const startTime = Date.now();
  console.log(`🚀 Starting chunked upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  // 🔧 FIX: Move sessionId and failedChunks outside try block for cleanup access
  let sessionId: string | null = null;
  const failedChunks = new Set<number>(); // 🔧 FIX: Move to function scope for error access
  let retryAttempts = 0; // 🔧 FIX: Move to function scope for error return
  
  try {
    // Validate file size for chunking (only chunk files > 10MB)
    if (file.size <= 10 * 1024 * 1024) {
      console.log('📁 File under 10MB, using standard upload');
      return await uploadFileToGoogleDrive(file, printSettings);
    }
    
    // Create session ID for this upload
    sessionId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const chunks = createChunks(file);
    
    // 🔄 RECOVERY: Recovery logic constants
    const maxRetryAttempts = 3;
    const baseRetryDelay = 1000; // 1 second
    let recoveredChunks = 0;
    
    // 🔧 FIX: Track actual uploaded bytes for accurate progress
    let uploadedBytes = 0;
    const chunkSizes = new Map<number, number>(); // Track individual chunk sizes
    chunks.forEach(chunk => chunkSizes.set(chunk.index, chunk.size));
    
    // Upload with recovery mechanism
    for (let attempt = 1; attempt <= maxRetryAttempts; attempt++) {
      console.log(`🔄 Upload attempt ${attempt}/${maxRetryAttempts}`);
      
      // Determine which chunks to upload this attempt
      const chunksToUpload = attempt === 1 
        ? chunks 
        : chunks.filter(chunk => failedChunks.has(chunk.index));
      
      if (chunksToUpload.length === 0) {
        console.log('✅ All chunks uploaded successfully!');
        break;
      }
      
      console.log(`📦 Uploading ${chunksToUpload.length} chunks (attempt ${attempt})`);
      retryAttempts = attempt - 1;
      
      // Track chunks that fail in this specific attempt
      const currentAttemptFailed = new Set<number>();
      
      // Upload chunks in parallel batches
      for (let i = 0; i < chunksToUpload.length; i += MAX_PARALLEL_CHUNKS) {
        const batch = chunksToUpload.slice(i, i + MAX_PARALLEL_CHUNKS);
        
        const batchPromises = batch.map(async (chunk) => {
          try {
            // 🔧 FIX: Use simplified upload without internal retries to avoid double retry
            const success = await uploadChunkSimple(chunk, sessionId, file.name, chunks.length);
            if (success) {
              // Remove from failed list if it was there
              const wasFailedBefore = failedChunks.has(chunk.index);
              failedChunks.delete(chunk.index);
              
              // 🔧 FIX: Only increment uploaded bytes if this chunk wasn't uploaded before
              if (wasFailedBefore) {
                recoveredChunks++;
                console.log(`🔄 Chunk ${chunk.index + 1} recovered on attempt ${attempt}`);
                // Add bytes back for recovered chunk
                uploadedBytes += chunkSizes.get(chunk.index) || 0;
              } else if (attempt === 1) {
                // First time uploading this chunk
                uploadedBytes += chunkSizes.get(chunk.index) || 0;
              }
              
              // 🔧 FIX: Accurate progress calculation using actual uploaded bytes
              const percentage = (uploadedBytes / file.size) * 100;
              onProgress?.({
                chunkIndex: chunk.index,
                totalChunks: chunks.length,
                uploadedBytes,
                totalBytes: file.size,
                percentage,
                retryAttempt: attempt > 1 ? attempt : undefined,
                failedChunks: Array.from(failedChunks)
              });
              
              return true;
            }
            throw new Error('Upload returned false');
          } catch (error) {
            console.warn(`⚠️ Chunk ${chunk.index + 1} failed (attempt ${attempt}):`, error);
            currentAttemptFailed.add(chunk.index);
            return false;
          }
        });
        
        // Wait for this batch to complete
        await Promise.allSettled(batchPromises);
      }
      
      // Update the overall failed chunks list
      currentAttemptFailed.forEach(index => failedChunks.add(index));
      
      // If no chunks failed in this attempt, we're done
      if (currentAttemptFailed.size === 0) {
        console.log(`✅ All chunks uploaded successfully on attempt ${attempt}`);
        break;
      }
      
      // If this was the last attempt and chunks still failed
      if (attempt === maxRetryAttempts && failedChunks.size > 0) {
        throw new Error(`🔄 Recovery failed: ${failedChunks.size} chunks still failed after ${maxRetryAttempts} attempts`);
      }
      
      // Wait before retry with exponential backoff
      if (attempt < maxRetryAttempts) {
        const delay = Math.min(baseRetryDelay * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`⏳ Waiting ${delay}ms before retry attempt ${attempt + 1}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // 🔧 FIX: Final progress update with actual uploaded bytes
    onProgress?.({
      chunkIndex: chunks.length - 1,
      totalChunks: chunks.length,
      uploadedBytes: file.size, // All chunks uploaded successfully
      totalBytes: file.size,
      percentage: 100,
      failedChunks: []
    });
    
    // Merge chunks on server
    console.log('🔗 Merging chunks on server...');
    const authHeaders = await getAuthHeaders();
    const mergeResponse = await fetch('/api/upload/merge-chunks', {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        fileName: file.name,
        totalChunks: chunks.length,
        fileSize: file.size,
        mimeType: file.type,
        printSettings
      })
    });
    
    const mergeResult = await mergeResponse.json();
    
    if (!mergeResult.success) {
      throw new Error(mergeResult.error || 'Failed to merge chunks');
    }
    
    const uploadTime = (Date.now() - startTime) / 1000;
    const averageSpeed = ((file.size / 1024 / 1024) / uploadTime).toFixed(2);
    
    console.log(`🎉 Chunked upload completed in ${uploadTime.toFixed(2)}s (${averageSpeed}MB/s)`);
    if (recoveredChunks > 0) {
      console.log(`🔄 Recovery stats: ${recoveredChunks} chunks recovered, ${retryAttempts} retry attempts`);
    }
    
    const result: ChunkedUploadResult = {
      success: true,
      url: mergeResult.url,
      downloadUrl: mergeResult.downloadUrl,
      previewUrl: mergeResult.previewUrl,
      provider: 'google_drive' as const,
      fileId: mergeResult.fileId,
      folderLink: mergeResult.folderLink,
      chunks: chunks.length,
      uploadTime,
      averageSpeed: `${averageSpeed}MB/s`,
      retryAttempts,
      recoveredChunks
    };
    
    // Notify server about successful upload
    await notifyServerUpload(file, result);
    return result;
    
  } catch (error) {
    console.error('❌ Chunked upload failed:', error);
    
    // 🔧 FIX: Safe cleanup with proper sessionId handling
    if (sessionId) {
      try {
        console.log('🧹 Cleaning up failed session...');
        await fetch('/api/upload/cleanup-chunks', {
          method: 'POST',
          headers: {
            ...(await getAuthHeaders()),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });
        console.log('✅ Session cleanup completed');
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup chunks:', cleanupError);
      }
    }
    
    // 🔧 FIX: Return actual failed chunks and retry attempts for debugging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Chunked upload failed',
      provider: undefined,
      retryAttempts, // 🔧 FIX: Return actual retry attempts value
      failedChunks: Array.from(failedChunks) // 🔧 FIX: Return actual failed chunks
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

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, FILE_TYPE_ERRORS, isValidFileType } from '@shared/file-types';

// Validate file for upload
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `حجم الملف كبير جداً (${(file.size / 1024 / 1024).toFixed(1)}MB). ${FILE_TYPE_ERRORS.FILE_TOO_LARGE}`
    };
  }

  // Type check using shared validation
  if (!isValidFileType(file)) {
    return {
      valid: false,
      error: `${FILE_TYPE_ERRORS.INVALID_TYPE}. نوع الملف المرسل: ${file.type}`
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
    const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const validation = validateFile(testFile);
    console.log('File validation test:', validation);
    
    return {
      status,
      validation,
      recommendation: status.recommended
    };
  };
}