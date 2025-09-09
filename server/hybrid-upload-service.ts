import { googleDriveService, type UploadResult as GoogleDriveResult } from './google-drive-service';

export interface HybridUploadResult {
  googleDrive?: {
    success: boolean;
    fileId?: string;
    webViewLink?: string;
    directDownloadLink?: string;
    folderLink?: string;
    folderHierarchy?: string;
    error?: string;
  };
  primaryUrl: string;
  backupUrls: string[];
  uploadId: string;
  message: string;
  orderNumber?: number;
  tempFolderId?: string;
  isTemporary?: boolean;
}

export interface UploadOptions {
  fileName?: string;
  folder?: string;
  googleDriveFolder?: string;
  customerName?: string;
  uploadDate?: string;
  shareWithEmail?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  useGoogleDriveAsBackup?: boolean;
  useCloudinaryAsPrimary?: boolean;
  useTemporaryStorage?: boolean;
  userId?: string;
  sessionId?: string;
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
   * Upload buffer to Google Drive with organized folder structure
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<HybridUploadResult> {
    const { 
      customerName = 'عميل غير محدد',
      uploadDate = new Date().toISOString().split('T')[0],
      shareWithEmail,
      googleDriveFolder,
      useTemporaryStorage = true, // Default to temporary storage for /print page
      userId,
      sessionId
    } = options;

    const uploadId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔄 Starting Google Drive buffer upload: ${uploadId}`);
    console.log(`   Customer: ${customerName}`);
    console.log(`   Date: ${uploadDate}`);
    console.log(`   File: ${fileName}`);

    const result: HybridUploadResult = {
      primaryUrl: '',
      backupUrls: [],
      uploadId,
      message: ''
    };

    // Upload to Google Drive
    if (googleDriveService.isEnabled()) {
      try {
        console.log('📤 Uploading buffer to Google Drive with organized structure...');

        let folderId = undefined;
        let folderHierarchy = '';

        // Check if we should use temporary storage (default for /print page)
        if (useTemporaryStorage && userId) {
          console.log(`📁 Creating temporary folder structure for user: ${userId}`);
          folderId = await googleDriveService.createTempFolderStructure(userId, sessionId);
          folderHierarchy = `مؤقت/${userId}/${sessionId || 'session'}`;
          
          // Mark as temporary upload
          result.isTemporary = true;
          result.tempFolderId = folderId || undefined;
        }
        // Use permanent order folder structure if not temporary or no userId
        else if (customerName && customerName !== 'عميل غير محدد') {
          console.log(`📁 Creating permanent order folder structure for: ${customerName}`);
          const orderResult = await googleDriveService.createOrderFolderStructure(customerName, uploadDate);
          folderId = orderResult.folderId || undefined;
          folderHierarchy = googleDriveService.getOrderFolderHierarchy(customerName, uploadDate, orderResult.orderNumber);
          
          // Store order number for later use
          result.orderNumber = orderResult.orderNumber;
          result.isTemporary = false;
        } 
        // Fallback to old system if specified
        else if (googleDriveFolder) {
          folderId = await googleDriveService.createFolder(googleDriveFolder);
          folderHierarchy = googleDriveFolder;
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
          folderHierarchy,
          error: googleDriveResult.error
        };

        if (googleDriveResult.success && googleDriveResult.fileId) {
          const directLink = googleDriveService.getDirectDownloadLink(googleDriveResult.fileId);
          result.googleDrive.directDownloadLink = directLink;
          
          // Add folder link if folder was created
          if (folderId) {
            result.googleDrive.folderLink = googleDriveService.getFolderWebViewLink(folderId);
          }

          // Share folder hierarchy with specified email if provided
          if (shareWithEmail && customerName && customerName !== 'عميل غير محدد') {
            try {
              console.log(`🔗 Sharing folder hierarchy with: ${shareWithEmail}`);
              const shareSuccess = await googleDriveService.shareHierarchyWithUser(
                customerName, 
                uploadDate, 
                shareWithEmail
              );
              if (shareSuccess) {
                result.message = `تم رفع الملف ومشاركته مع ${shareWithEmail} في: ${folderHierarchy}`;
                console.log(`✅ Folder hierarchy shared successfully with ${shareWithEmail}`);
              } else {
                result.message = `تم رفع الملف ولكن فشلت المشاركة مع ${shareWithEmail} في: ${folderHierarchy}`;
                console.log(`⚠️ Failed to share with ${shareWithEmail}, but upload successful`);
              }
            } catch (shareError: any) {
              console.error(`❌ Error sharing with ${shareWithEmail}:`, shareError.message);
              result.message = `تم رفع الملف ولكن فشلت المشاركة مع ${shareWithEmail} في: ${folderHierarchy}`;
            }
          } else {
            result.message = `تم رفع الملف بنجاح إلى Google Drive في: ${folderHierarchy}`;
          }
          
          result.backupUrls.push(directLink);
          result.primaryUrl = directLink;
        }

        console.log(`✅ Google Drive buffer upload successful`);
        console.log(`   Folder structure: ${folderHierarchy}`);

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