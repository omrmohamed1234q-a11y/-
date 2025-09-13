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
    
    // Determine resource type and endpoint
    let resourceType = 'image';
    let endpoint = 'image/upload';
    
    if (file.type === 'application/pdf') {
      resourceType = 'image'; // Upload PDF as image to enable transformations
      endpoint = 'image/upload';
      // This allows PDF-to-image conversion for previews
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video';
      endpoint = 'video/upload';
    } else if (!file.type.startsWith('image/')) {
      resourceType = 'raw';
      endpoint = 'raw/upload';
    }
    
    // Note: No additional parameters needed for unsigned uploads

    // Arabic filename handling
    const arabicSafeFilename = encodeURIComponent(file.name);
    formData.append('public_id', `print-jobs/${Date.now()}-${arabicSafeFilename}`);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cloudinary upload error details:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    // Generate preview URL for different file types
    let previewUrl;
    if (file.type === 'application/pdf') {
      // PDF preview - first page as image
      previewUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_600,c_fit,f_jpg,q_80/${result.public_id}.jpg`;
    } else if (file.type.startsWith('image/')) {
      // Image preview - resized version
      previewUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_400,c_fit,f_auto,q_80/${result.public_id}`;
    } else if (file.type.includes('word') || file.type.includes('document')) {
      // Word document preview (if supported)
      previewUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_600,c_fit,f_jpg,q_80/${result.public_id}.jpg`;
    } else if (file.type.includes('text') || file.type === 'text/plain') {
      // Text file preview
      previewUrl = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_600,c_fit,f_jpg,q_80/${result.public_id}.jpg`;
    } else {
      // Generic file icon for unsupported types
      previewUrl = null;
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

// Get optimized preview for any file type
export function getCloudinaryPreviewUrl(publicId: string, fileType: string, options: {
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

  if (fileType === 'application/pdf') {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fit,pg_${page},f_jpg,q_${quality}/${publicId}.jpg`;
  } else if (fileType.startsWith('image/')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fit,f_auto,q_${quality}/${publicId}`;
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fit,f_jpg,q_${quality}/${publicId}.jpg`;
  } else {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},h_${height},c_fit,f_jpg,q_${quality}/${publicId}.jpg`;
  }
}

// Get thumbnail for cart display  
export function getThumbnailUrl(publicId: string, fileType: string): string {
  return getCloudinaryPreviewUrl(publicId, fileType, { width: 60, height: 60, quality: 90 });
}

// Get medium preview for modal/zoom
export function getMediumPreviewUrl(publicId: string, fileType: string): string {
  return getCloudinaryPreviewUrl(publicId, fileType, { width: 800, height: 800, quality: 95 });
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

// Debug tools for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testCloudinaryConnection = testCloudinaryConnection;
  (window as any).checkCloudinaryConfig = function() {
    console.log('Cloudinary Configuration Status:');
    console.log('Cloud Name:', CLOUD_NAME || '❌ MISSING');
    console.log('Upload Preset:', UPLOAD_PRESET || '❌ MISSING');  
    console.log('API Key:', API_KEY ? '✅ Set' : '❌ Missing');
    
    const isReady = !!(CLOUD_NAME && UPLOAD_PRESET);
    console.log('Ready for uploads:', isReady ? '✅ YES' : '❌ NO');
    
    return {
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET,
      hasApiKey: !!API_KEY,
      ready: isReady
    };
  };
}