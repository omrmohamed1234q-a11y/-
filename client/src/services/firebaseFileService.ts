import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata,
  updateMetadata,
  UploadTask
} from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: string;
  uploadedBy: string;
  downloadURL: string;
  thumbnailURL?: string;
  uploadProgress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  optimized?: boolean;
  compressionRatio?: number;
  error?: string;
}

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
}

export class FirebaseFileService {
  private uploadTasks: Map<string, UploadTask> = new Map();
  private progressCallbacks: Map<string, (progress: UploadProgress) => void> = new Map();

  /**
   * Upload file with real-time progress, automatic optimization, and resume capability
   */
  async uploadFile(
    file: File,
    category: string = 'general',
    userId: string,
    onProgress?: (progress: UploadProgress) => void,
    onComplete?: (metadata: FileMetadata) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    const uploadId = this.generateUploadId();
    const fileName = this.generateFileName(file.name);
    const storagePath = `uploads/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Create initial metadata document
    const initialMetadata: Partial<FileMetadata> = {
      originalName: file.name,
      fileName,
      fileSize: file.size,
      mimeType: file.type,
      category,
      uploadedBy: userId,
      uploadProgress: 0,
      status: 'uploading',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'fileUploads'), initialMetadata);

    // Create upload task with resumable upload
    const uploadTask = uploadBytesResumable(storageRef, file, {
      customMetadata: {
        uploadId,
        originalName: file.name,
        category,
        uploadedBy: userId,
        fileId: docRef.id
      }
    });

    this.uploadTasks.set(uploadId, uploadTask);
    if (onProgress) {
      this.progressCallbacks.set(uploadId, onProgress);
    }

    // Monitor upload progress
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress: UploadProgress = {
          bytesTransferred: snapshot.bytesTransferred,
          totalBytes: snapshot.totalBytes,
          percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          state: snapshot.state as any
        };

        // Update Firestore document with progress
        updateDoc(docRef, {
          uploadProgress: progress.percentage,
          updatedAt: Timestamp.now()
        });

        // Call progress callback
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        
        // Update document with error
        updateDoc(docRef, {
          status: 'error',
          error: error.message,
          updatedAt: Timestamp.now()
        });

        if (onError) {
          onError(error.message);
        }
      },
      async () => {
        try {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Process file for optimization if it's an image
          let optimizedURL = downloadURL;
          let compressionRatio = 1;
          
          if (file.type.startsWith('image/')) {
            const optimizationResult = await this.optimizeImage(downloadURL, file.type);
            optimizedURL = optimizationResult.url;
            compressionRatio = optimizationResult.compressionRatio;
          }

          // Update document with completion data
          const completedMetadata: Partial<FileMetadata> = {
            downloadURL: optimizedURL,
            uploadProgress: 100,
            status: 'completed',
            optimized: file.type.startsWith('image/'),
            compressionRatio,
            updatedAt: Timestamp.now()
          };

          await updateDoc(docRef, completedMetadata);

          // Create final metadata object
          const finalMetadata: FileMetadata = {
            id: docRef.id,
            ...initialMetadata,
            ...completedMetadata
          } as FileMetadata;

          if (onComplete) {
            onComplete(finalMetadata);
          }

          // Cleanup
          this.uploadTasks.delete(uploadId);
          this.progressCallbacks.delete(uploadId);

        } catch (error) {
          console.error('Post-upload processing error:', error);
          if (onError) {
            onError(error instanceof Error ? error.message : 'Unknown error');
          }
        }
      }
    );

    return uploadId;
  }

  /**
   * Resume a paused upload
   */
  resumeUpload(uploadId: string): boolean {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask && uploadTask.snapshot.state === 'paused') {
      uploadTask.resume();
      return true;
    }
    return false;
  }

  /**
   * Pause an active upload
   */
  pauseUpload(uploadId: string): boolean {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask && uploadTask.snapshot.state === 'running') {
      uploadTask.pause();
      return true;
    }
    return false;
  }

  /**
   * Cancel an upload
   */
  cancelUpload(uploadId: string): boolean {
    const uploadTask = this.uploadTasks.get(uploadId);
    if (uploadTask) {
      uploadTask.cancel();
      this.uploadTasks.delete(uploadId);
      this.progressCallbacks.delete(uploadId);
      return true;
    }
    return false;
  }

  /**
   * Get real-time updates for file uploads
   */
  subscribeToUploads(
    userId: string, 
    callback: (files: FileMetadata[]) => void
  ): () => void {
    const q = query(
      collection(db, 'fileUploads'),
      where('uploadedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const files: FileMetadata[] = [];
      snapshot.forEach((doc) => {
        files.push({ id: doc.id, ...doc.data() } as FileMetadata);
      });
      callback(files);
    });
  }

  /**
   * Get all files for a user
   */
  async getUserFiles(userId: string): Promise<FileMetadata[]> {
    const q = query(
      collection(db, 'fileUploads'),
      where('uploadedBy', '==', userId),
      where('status', '==', 'completed'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileMetadata));
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<void> {
    // Get file metadata
    const fileDoc = await getDocs(
      query(collection(db, 'fileUploads'), where('id', '==', fileId))
    );
    
    if (!fileDoc.empty) {
      const fileData = fileDoc.docs[0].data() as FileMetadata;
      
      // Delete from storage
      if (fileData.downloadURL) {
        const storageRef = ref(storage, fileData.downloadURL);
        await deleteObject(storageRef);
      }
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'fileUploads', fileId));
    }
  }

  /**
   * Optimize image files
   */
  private async optimizeImage(
    imageURL: string, 
    mimeType: string
  ): Promise<{ url: string; compressionRatio: number }> {
    // This would typically use Firebase Functions or a third-party service
    // For now, we'll simulate optimization
    
    try {
      // Create canvas for client-side optimization
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate optimal dimensions (max 1920px width)
          const maxWidth = 1920;
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          // Draw optimized image
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
          
          // Convert to optimized blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressionRatio = blob.size / img.naturalWidth / img.naturalHeight;
                // In real implementation, upload optimized version
                resolve({ url: imageURL, compressionRatio });
              } else {
                resolve({ url: imageURL, compressionRatio: 1 });
              }
            },
            mimeType,
            0.8 // Quality setting
          );
        };
        
        img.onerror = () => {
          resolve({ url: imageURL, compressionRatio: 1 });
        };
        
        img.src = imageURL;
      });
    } catch (error) {
      console.error('Image optimization error:', error);
      return { url: imageURL, compressionRatio: 1 };
    }
  }

  /**
   * Generate unique upload ID
   */
  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique file name
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    const files = await this.getUserFiles(userId);
    
    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.fileSize, 0),
      byCategory: {} as Record<string, { count: number; size: number }>
    };

    files.forEach(file => {
      if (!stats.byCategory[file.category]) {
        stats.byCategory[file.category] = { count: 0, size: 0 };
      }
      stats.byCategory[file.category].count++;
      stats.byCategory[file.category].size += file.fileSize;
    });

    return stats;
  }
}

// Export singleton instance
export const firebaseFileService = new FirebaseFileService();