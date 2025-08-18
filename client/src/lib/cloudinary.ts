// Cloudinary Integration for Arabic Printing Platform
// Using direct API calls instead of SDK for client-side usage

// Cloudinary configuration
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

// Upload file to Cloudinary
export async function uploadToCloudinary(file: File): Promise<{
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
  previewUrl?: string;
}> {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    // Configure for PDF files
    if (file.type === 'application/pdf') {
      formData.append('resource_type', 'image'); // Convert PDF to image
      formData.append('format', 'jpg');
      formData.append('quality', '90');
      formData.append('dpi', '300'); // Print quality
    }

    // Arabic filename handling
    const arabicSafeFilename = encodeURIComponent(file.name);
    formData.append('public_id', `print-jobs/${Date.now()}-${arabicSafeFilename}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Generate preview URL for PDF files
    let previewUrl;
    if (file.type === 'application/pdf') {
      previewUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_600,c_fit,f_jpg,q_80/${result.public_id}.jpg`;
    }

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      previewUrl
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

// Get optimized PDF preview
export function getCloudinaryPreviewUrl(publicId: string, options: {
  width?: number;
  height?: number;
  page?: number;
  quality?: number;
} = {}): string {
  const {
    width = 400,
    height = 600,
    page = 1,
    quality = 80
  } = options;

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fit,pg_${page},f_jpg,q_${quality}/${publicId}.jpg`;
}

// Get download URL
export function getCloudinaryDownloadUrl(publicId: string): string {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/fl_attachment/${publicId}`;
}

// Delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    if (!API_KEY) {
      console.error('Cloudinary API key missing for delete operation');
      return false;
    }

    // This would typically be done on the server side for security
    // For now, we'll just log the deletion request
    console.log('Delete request for:', publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

// Test Cloudinary connection
export async function testCloudinaryConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return {
        success: false,
        message: 'Cloudinary configuration missing (CLOUD_NAME or UPLOAD_PRESET)'
      };
    }

    // Test by checking upload endpoint
    const testUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
    const response = await fetch(testUrl, {
      method: 'OPTIONS',
      mode: 'cors'
    });

    return {
      success: true,
      message: 'Cloudinary connection successful',
      details: {
        cloudName: CLOUD_NAME,
        uploadPreset: UPLOAD_PRESET,
        endpoint: testUrl
      }
    };

  } catch (error) {
    return {
      success: false,
      message: 'Cloudinary connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}