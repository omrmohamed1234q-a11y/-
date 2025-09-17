/**
 * Local file handling for development and testing
 * This bypasses Firebase for immediate functionality
 */

export interface ProcessedFile {
  originalFile: File;
  dataUrl: string;
  size: number;
  type: string;
  name: string;
  id: string;
}

/**
 * Process files locally without uploading to any service
 * This creates data URLs for immediate use
 */
export async function processFilesLocally(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ProcessedFile[]> {
  const processedFiles: ProcessedFile[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress((i / files.length) * 50);
    }
    
    // Create data URL from file
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
      reader.readAsDataURL(file);
    });
    
    if (onProgress) {
      onProgress(((i + 0.5) / files.length) * 100);
    }
    
    processedFiles.push({
      originalFile: file,
      dataUrl,
      size: file.size,
      type: file.type,
      name: file.name,
      id: `local_${Date.now()}_${Math.random().toString(36).substring(2)}`
    });
    
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100);
    }
  }
  
  return processedFiles;
}

/**
 * Convert processed files to URLs for immediate use
 */
export function getFileUrls(processedFiles: ProcessedFile[]): string[] {
  return processedFiles.map(f => f.dataUrl);
}

// 🗂️ STORAGE OPTIMIZATION: Track storage usage and implement compression
const STORAGE_WARNING_THRESHOLD = 3 * 1024 * 1024; // 3MB warning
const STORAGE_MAX_THRESHOLD = 4.5 * 1024 * 1024; // 4.5MB max (leave 0.5MB buffer)

/**
 * Calculate approximate localStorage usage
 */
function calculateStorageUsage(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage[key].length + key.length;
    }
  }
  return total;
}

/**
 * Compress file data by removing unnecessary dataUrl for large files
 */
function compressFileData(processedFiles: ProcessedFile[]): any[] {
  return processedFiles.map(f => {
    const basicData = {
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      // 🔥 OPTIMIZATION: Store metadata only for large files, skip dataUrl
      compressedStorage: f.size > 1024 * 1024 // 1MB threshold
    };
    
    // Only store dataUrl for small files (<1MB)
    if (f.size <= 1024 * 1024) {
      return { ...basicData, dataUrl: f.dataUrl };
    } else {
      // For large files, store a placeholder and rely on server storage
      return {
        ...basicData,
        dataUrl: `data:text/plain;base64,${btoa(`Large file: ${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB) - Stored on server`)}`
      };
    }
  });
}

/**
 * Clean old data from localStorage when approaching limits
 */
function cleanOldStorageData(): void {
  const keysToCheck = ['uploadedFiles', 'tbaaly_print_settings', 'recentDeliverySearches'];
  const currentUsage = calculateStorageUsage();
  
  if (currentUsage > STORAGE_WARNING_THRESHOLD) {
    console.warn(`⚠️ localStorage usage high: ${(currentUsage / 1024 / 1024).toFixed(2)}MB`);
    
    // Remove old uploaded files if storage is full
    if (currentUsage > STORAGE_MAX_THRESHOLD) {
      console.warn('🧹 Cleaning old uploaded files to free space');
      localStorage.removeItem('uploadedFiles');
    }
  }
}

/**
 * Save processed file information to localStorage with optimization
 */
export function saveFilesToStorage(processedFiles: ProcessedFile[]): void {
  try {
    // Clean old data first if needed
    cleanOldStorageData();
    
    // Compress file data to reduce storage usage
    const compressedData = compressFileData(processedFiles);
    
    // Calculate size before storing
    const dataString = JSON.stringify(compressedData);
    const estimatedSize = dataString.length;
    
    console.log(`💾 Storing ${processedFiles.length} files (${(estimatedSize / 1024).toFixed(1)}KB)`);
    
    // Check if this would exceed our limits
    const currentUsage = calculateStorageUsage();
    if (currentUsage + estimatedSize > STORAGE_MAX_THRESHOLD) {
      console.warn('⚠️ Storage limit reached - using memory only');
      // Store in memory only for this session
      (window as any).__temp_uploaded_files = compressedData;
      return;
    }
    
    localStorage.setItem('uploadedFiles', dataString);
    console.log(`✅ Files saved to localStorage (${(estimatedSize / 1024).toFixed(1)}KB)`);
    
  } catch (error) {
    console.error('❌ localStorage save failed:', error);
    // Fallback to memory storage
    (window as any).__temp_uploaded_files = compressFileData(processedFiles);
    console.log('📝 Using memory fallback for file storage');
  }
}

/**
 * Load processed files from localStorage with fallback support
 */
export function loadFilesFromStorage(): ProcessedFile[] {
  try {
    // Try localStorage first
    let stored = localStorage.getItem('uploadedFiles');
    let source = 'localStorage';
    
    // Fallback to memory storage if localStorage is empty
    if (!stored && (window as any).__temp_uploaded_files) {
      stored = JSON.stringify((window as any).__temp_uploaded_files);
      source = 'memory';
    }
    
    if (!stored) return [];
    
    const fileData = JSON.parse(stored);
    console.log(`📁 Loaded ${fileData.length} files from ${source}`);
    
    return fileData.map((f: any) => ({
      originalFile: null, // Can't restore original file object
      dataUrl: f.dataUrl,
      size: f.size,
      type: f.type,
      name: f.name,
      id: f.id,
      fromCompressedStorage: f.compressedStorage
    }));
  } catch (error) {
    console.error('❌ Error loading files from storage:', error);
    return [];
  }
}

/**
 * Get current storage status for debugging
 */
export function getStorageStatus(): {
  usage: number;
  usageMB: string;
  isNearLimit: boolean;
  filesCount: number;
} {
  const usage = calculateStorageUsage();
  const stored = localStorage.getItem('uploadedFiles');
  let filesCount = 0;
  
  try {
    if (stored) {
      const fileData = JSON.parse(stored);
      filesCount = Array.isArray(fileData) ? fileData.length : 0;
    }
    
    // Also check memory storage
    if ((window as any).__temp_uploaded_files) {
      filesCount += (window as any).__temp_uploaded_files.length;
    }
  } catch (error) {
    console.error('Error counting files:', error);
  }
  
  return {
    usage,
    usageMB: (usage / 1024 / 1024).toFixed(2),
    isNearLimit: usage > STORAGE_WARNING_THRESHOLD,
    filesCount
  };
}