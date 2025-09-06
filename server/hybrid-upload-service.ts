import { googleDriveService, type UploadResult as GoogleDriveResult } from './google-drive-service';

export interface HybridUploadResult {
  googleDrive?: {
    success: boolean;
    fileId?: string;
    webViewLink?: string;
    directDownloadLink?: string;
    error?: string;
  };
  primaryUrl: string;
  backupUrls: string[];
  uploadId: string;
  message: string;
}

export interface UploadOptions {
  fileName?: string;
  folder?: string;
  googleDriveFolder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  useGoogleDriveAsBackup?: boolean;
  useCloudinaryAsPrimary?: boolean;
}

export class HybridUploadService {
  private static instance: HybridUploadService;
  
  constructor() {
    console.log('📁 Hybrid Upload Service initialized (Google Drive backup system)');
  }

  static getInstance(): HybridUploadService {
    if (!HybridUploadService.instance) {
      HybridUploadService.instance = new HybridUploadService();
    }
    return HybridUploadService.instance;
  }

  /**
   * Upload file to Google Drive as backup/primary storage
   */
  async uploadFile(
    filePath: string,
    options: UploadOptions = {}
  ): Promise<HybridUploadResult> {
    const {
      fileName,
      googleDriveFolder,
      useGoogleDriveAsBackup = true
    } = options;

    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄 Starting Google Drive backup upload: ${uploadId}`);

    const result: HybridUploadResult = {
      primaryUrl: '',
      backupUrls: [],
      uploadId,
      message: ''
    };

    // Upload to Google Drive (Backup system)
    if (useGoogleDriveAsBackup && googleDriveService.isEnabled()) {
      try {
        console.log('📤 Uploading to Google Drive backup...');

        // Create folder if specified
        let folderId = undefined;
        if (googleDriveFolder) {
          folderId = await googleDriveService.createFolder(googleDriveFolder);
        }

        const googleDriveResult = await googleDriveService.uploadFile(
          filePath,
          fileName,
          folderId || undefined
        );

        result.googleDrive = {
          success: googleDriveResult.success,
          fileId: googleDriveResult.fileId,
          webViewLink: googleDriveResult.webViewLink,
          error: googleDriveResult.error
        };

        if (googleDriveResult.success && googleDriveResult.fileId) {
          const directLink = googleDriveService.getDirectDownloadLink(googleDriveResult.fileId);
          result.googleDrive.directDownloadLink = directLink;
          result.backupUrls.push(directLink);
          result.primaryUrl = directLink;
          result.message = 'تم الرفع بنجاح إلى Google Drive كنسخة احتياطية';
        } else {
          result.message = 'فشل في الرفع إلى Google Drive';
        }

        console.log('✅ Google Drive upload successful');

      } catch (error: any) {
        console.error('❌ Google Drive upload failed:', error.message);
        result.googleDrive = {
          success: false,
          error: error.message
        };
        result.message = `فشل في الرفع: ${error.message}`;
      }
    } else {
      result.message = 'Google Drive غير مكوّن';
    }

    // Log final result
    console.log(`🎯 Google Drive backup upload completed: ${uploadId}`);
    console.log(`   Primary URL: ${result.primaryUrl}`);
    console.log(`   Google Drive: ${result.googleDrive?.success ? '✅' : '❌'}`);

    return result;
  }

  /**
   * Upload buffer to Google Drive
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<HybridUploadResult> {
    const { googleDriveFolder } = options;

    const uploadId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄 Starting Google Drive buffer upload: ${uploadId}`);

    const result: HybridUploadResult = {
      primaryUrl: '',
      backupUrls: [],
      uploadId,
      message: ''
    };

    // Upload to Google Drive
    if (googleDriveService.isEnabled()) {
      try {
        console.log('📤 Uploading buffer to Google Drive...');

        // Create folder if specified
        let folderId = undefined;
        if (googleDriveFolder) {
          folderId = await googleDriveService.createFolder(googleDriveFolder);
        }

        const googleDriveResult = await googleDriveService.uploadBuffer(
          buffer,
          fileName,
          mimeType,
          folderId || undefined
        );

        result.googleDrive = {
          success: googleDriveResult.success,
          fileId: googleDriveResult.fileId,
          webViewLink: googleDriveResult.webViewLink,
          error: googleDriveResult.error
        };

        if (googleDriveResult.success && googleDriveResult.fileId) {
          const directLink = googleDriveService.getDirectDownloadLink(googleDriveResult.fileId);
          result.googleDrive.directDownloadLink = directLink;
          result.backupUrls.push(directLink);
          result.primaryUrl = directLink;
          result.message = 'تم رفع الملف بنجاح إلى Google Drive';
        }

        console.log('✅ Google Drive buffer upload successful');

      } catch (error: any) {
        console.error('❌ Google Drive buffer upload failed:', error.message);
        result.googleDrive = {
          success: false,
          error: error.message
        };
        result.message = `فشل في رفع الملف: ${error.message}`;
      }
    } else {
      result.message = 'Google Drive غير مكوّن';
    }

    console.log(`🎯 Google Drive buffer upload completed: ${uploadId}`);
    return result;
  }

  /**
   * Get service status
   */
  getServiceStatus() {
    return {
      googleDrive: {
        configured: googleDriveService.isEnabled(),
        status: googleDriveService.isEnabled() ? 'Ready' : 'Not configured'
      },
      note: 'Cloudinary runs on frontend, Google Drive provides server backup'
    };
  }

  /**
   * Test services
   */
  async testServices() {
    const results: any = {};

    // Test Google Drive
    results.googleDrive = await googleDriveService.testConnection();
    
    // Note about Cloudinary
    results.note = 'Cloudinary testing should be done from frontend';

    return results;
  }
}

// Export singleton instance
export const hybridUploadService = HybridUploadService.getInstance();