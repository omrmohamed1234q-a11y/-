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

/**
 * Save processed file information to localStorage for persistence
 */
export function saveFilesToStorage(processedFiles: ProcessedFile[]): void {
  const fileData = processedFiles.map(f => ({
    id: f.id,
    name: f.name,
    size: f.size,
    type: f.type,
    dataUrl: f.dataUrl
  }));
  
  localStorage.setItem('uploadedFiles', JSON.stringify(fileData));
}

/**
 * Load processed files from localStorage
 */
export function loadFilesFromStorage(): ProcessedFile[] {
  try {
    const stored = localStorage.getItem('uploadedFiles');
    if (!stored) return [];
    
    const fileData = JSON.parse(stored);
    return fileData.map((f: any) => ({
      originalFile: null, // Can't restore original file object
      dataUrl: f.dataUrl,
      size: f.size,
      type: f.type,
      name: f.name,
      id: f.id
    }));
  } catch (error) {
    console.error('Error loading files from storage:', error);
    return [];
  }
}