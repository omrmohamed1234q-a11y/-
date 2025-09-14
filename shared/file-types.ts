// Shared file type constants for upload validation
// Ensures consistency across all validation functions

export const ALLOWED_FILE_TYPES = {
  // MIME types
  MIME_TYPES: [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf'
  ],
  
  // File extensions
  EXTENSIONS: [
    'jpg',
    'jpeg', 
    'png',
    'gif',
    'pdf'
  ],
  
  // Wildcard patterns for file pickers
  PICKER_TYPES: [
    'image/*',
    'application/pdf'
  ]
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Helper function to validate file
export function isValidFileType(file: File): boolean {
  return ALLOWED_FILE_TYPES.MIME_TYPES.includes(file.type as any);
}

export function isValidFileExtension(filename: string): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? ALLOWED_FILE_TYPES.EXTENSIONS.includes(extension as any) : false;
}

// User-friendly error messages in Arabic
export const FILE_TYPE_ERRORS = {
  INVALID_TYPE: `نوع الملف غير مدعوم. الأنواع المدعومة: ${ALLOWED_FILE_TYPES.EXTENSIONS.join(', ')}`,
  FILE_TOO_LARGE: `حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
  INVALID_EXTENSION: 'امتداد الملف غير صحيح'
} as const;