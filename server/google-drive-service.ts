import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
}

export interface UploadResult {
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

export class GoogleDriveService {
  private auth: any;
  private drive: any;
  private isConfigured: boolean = false;

  constructor(config?: GoogleDriveConfig) {
    this.initializeAuth(config);
  }

  private initializeAuth(config?: GoogleDriveConfig) {
    try {
      // Try to get configuration from environment variables or passed config
      const clientId = config?.clientId || process.env.GOOGLE_CLIENT_ID;
      const clientSecret = config?.clientSecret || process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = config?.redirectUri || process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
      const refreshToken = config?.refreshToken || process.env.GOOGLE_REFRESH_TOKEN;

      if (!clientId || !clientSecret || !refreshToken) {
        console.warn('⚠️ Google Drive credentials not configured. Google Drive backup will be disabled.');
        this.isConfigured = false;
        return;
      }

      // Create OAuth2 client
      this.auth = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      // Set credentials
      this.auth.setCredentials({
        refresh_token: refreshToken
      });

      // Initialize Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      this.isConfigured = true;

      console.log('✅ Google Drive service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Check if Google Drive is properly configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    filePath: string, 
    fileName?: string, 
    folderId?: string,
    mimeType?: string
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Google Drive not configured'
      };
    }

    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      const actualFileName = fileName || path.basename(filePath);
      const fileMetadata: any = {
        name: actualFileName
      };

      // Add parent folder if specified
      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      console.log(`📤 Uploading file to Google Drive: ${actualFileName}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink'
      });

      // Set file permissions to allow anyone with link to view
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      console.log(`✅ File uploaded to Google Drive successfully: ${response.data.id}`);

      return {
        success: true,
        fileId: response.data.id,
        webViewLink: response.data.webViewLink
      };

    } catch (error: any) {
      console.error('❌ Google Drive upload failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Upload buffer directly to Google Drive
   */
  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Google Drive not configured'
      };
    }

    try {
      const fileMetadata: any = {
        name: fileName
      };

      if (folderId) {
        fileMetadata.parents = [folderId];
      }

      // Convert buffer to readable stream for Google Drive API
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null); // End the stream

      const media = {
        mimeType: mimeType,
        body: stream
      };

      console.log(`📤 Uploading buffer to Google Drive: ${fileName}`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,webViewLink'
      });

      // Set public permissions
      await this.drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'reader',
          type: 'anyone'
        }
      });

      console.log(`✅ Buffer uploaded to Google Drive successfully: ${response.data.id}`);

      return {
        success: true,
        fileId: response.data.id,
        webViewLink: response.data.webViewLink
      };

    } catch (error: any) {
      console.error('❌ Google Drive buffer upload failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create or get folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      // First, check if folder already exists
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const searchResponse = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      // If folder exists, return its ID
      if (searchResponse.data.files && searchResponse.data.files.length > 0) {
        console.log(`📁 Folder '${folderName}' already exists: ${searchResponse.data.files[0].id}`);
        return searchResponse.data.files[0].id;
      }

      // Create new folder
      const folderMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id'
      });

      console.log(`📁 Created Google Drive folder '${folderName}': ${response.data.id}`);
      return response.data.id;

    } catch (error: any) {
      console.error('❌ Failed to create Google Drive folder:', error.message);
      return null;
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.drive.files.delete({
        fileId: fileId
      });

      console.log(`🗑️ File deleted from Google Drive: ${fileId}`);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to delete file from Google Drive:', error.message);
      return false;
    }
  }

  /**
   * Get file download link
   */
  getDownloadLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Get direct download link
   */
  getDirectDownloadLink(fileId: string): string {
    return `https://drive.google.com/uc?id=${fileId}&export=download`;
  }

  /**
   * Get folder web view link
   */
  getFolderWebViewLink(folderId: string): string {
    return `https://drive.google.com/drive/folders/${folderId}`;
  }

  /**
   * Create temporary folder structure: مؤقت/[userId]/[sessionId]
   */
  async createTempFolderStructure(userId: string, sessionId?: string): Promise<string | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      const tempSessionId = sessionId || `session_${Date.now()}`;
      console.log(`📁 Creating temp folder structure for user: ${userId}, session: ${tempSessionId}`);

      // Step 1: Create or get main "مؤقت" folder
      const tempMainFolderId = await this.createFolder('مؤقت');
      if (!tempMainFolderId) {
        throw new Error('Failed to create main مؤقت folder');
      }

      // Step 2: Create or get user folder inside temp folder
      const userFolderId = await this.createFolder(userId, tempMainFolderId);
      if (!userFolderId) {
        throw new Error(`Failed to create user folder: ${userId}`);
      }

      // Step 3: Create session folder inside user folder
      const sessionFolderId = await this.createFolder(tempSessionId, userFolderId);
      if (!sessionFolderId) {
        throw new Error(`Failed to create session folder: ${tempSessionId}`);
      }

      console.log(`✅ Temp folder structure created successfully:`);
      console.log(`   مؤقت/${userId}/${tempSessionId}/`);
      console.log(`   Temp folder ID: ${sessionFolderId}`);

      return sessionFolderId;

    } catch (error: any) {
      console.error('❌ Failed to create temp folder structure:', error.message);
      return null;
    }
  }

  /**
   * Move files from temp folder to permanent order folder
   */
  async moveFilesToPermanentLocation(
    tempFolderId: string,
    customerName: string,
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<{ success: boolean; orderNumber: number; permanentFolderId?: string; error?: string }> {
    if (!this.isConfigured) {
      return { success: false, orderNumber: 1, error: 'Google Drive not configured' };
    }

    try {
      console.log(`🚀 Moving files from temp folder ${tempFolderId} to permanent location`);

      // Create permanent order folder structure
      const orderResult = await this.createOrderFolderStructure(customerName, date);
      if (!orderResult.folderId) {
        throw new Error('Failed to create permanent order folder');
      }

      // Get all files in temp folder
      const filesQuery = `'${tempFolderId}' in parents and trashed=false`;
      const filesResponse = await this.drive.files.list({
        q: filesQuery,
        fields: 'files(id, name)'
      });

      const files = filesResponse.data.files || [];
      console.log(`📦 Found ${files.length} files to move from temp to permanent`);

      // Move each file to permanent location
      for (const file of files) {
        if (file.id) {
          await this.moveFileWithinDrive(file.id, orderResult.folderId);
          console.log(`✅ Moved file: ${file.name}`);
        }
      }

      // Clean up temp folder after successful move
      await this.deleteFolder(tempFolderId);
      
      console.log(`✅ Successfully moved ${files.length} files to permanent location`);
      console.log(`   Permanent folder: ${this.getOrderFolderHierarchy(customerName, date, orderResult.orderNumber)}`);

      return {
        success: true,
        orderNumber: orderResult.orderNumber,
        permanentFolderId: orderResult.folderId
      };

    } catch (error: any) {
      console.error('❌ Failed to move files to permanent location:', error.message);
      return {
        success: false,
        orderNumber: 1,
        error: error.message
      };
    }
  }

  /**
   * Move a file from one folder to another within Google Drive
   */
  async moveFileWithinDrive(fileId: string, newParentFolderId: string): Promise<boolean> {
    try {
      // Get current parents
      const file = await this.drive.files.get({
        fileId: fileId,
        fields: 'parents'
      });

      const previousParents = file.data.parents?.join(',') || '';

      // Move file to new parent
      await this.drive.files.update({
        fileId: fileId,
        addParents: newParentFolderId,
        removeParents: previousParents,
        fields: 'id, parents'
      });

      return true;
    } catch (error: any) {
      console.error(`❌ Failed to move file ${fileId}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a folder and all its contents
   */
  async deleteFolder(folderId: string): Promise<boolean> {
    try {
      await this.drive.files.delete({
        fileId: folderId
      });
      console.log(`🗑️ Deleted folder: ${folderId}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to delete folder ${folderId}:`, error.message);
      return false;
    }
  }

  /**
   * Clean up temporary files older than specified hours
   */
  async cleanupOldTempFiles(hoursOld: number = 24): Promise<{ cleaned: number; errors: number }> {
    if (!this.isConfigured) {
      return { cleaned: 0, errors: 0 };
    }

    try {
      console.log(`🧹 Starting cleanup of temp files older than ${hoursOld} hours`);

      // Find main temp folder
      const tempFolderId = await this.findFolderByName('مؤقت');
      if (!tempFolderId) {
        console.log('ℹ️ No temp folder found, nothing to clean');
        return { cleaned: 0, errors: 0 };
      }

      // Get all user folders in temp
      const userFoldersQuery = `'${tempFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const userFoldersResponse = await this.drive.files.list({
        q: userFoldersQuery,
        fields: 'files(id, name, createdTime)'
      });

      let cleaned = 0;
      let errors = 0;
      const cutoffTime = new Date(Date.now() - (hoursOld * 60 * 60 * 1000));

      for (const userFolder of userFoldersResponse.data.files || []) {
        // Get session folders in each user folder
        const sessionFoldersQuery = `'${userFolder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const sessionFoldersResponse = await this.drive.files.list({
          q: sessionFoldersQuery,
          fields: 'files(id, name, createdTime)'
        });

        for (const sessionFolder of sessionFoldersResponse.data.files || []) {
          if (sessionFolder.createdTime) {
            const createdTime = new Date(sessionFolder.createdTime);
            if (createdTime < cutoffTime) {
              console.log(`🗑️ Cleaning up old temp session: ${sessionFolder.name} (created: ${createdTime.toISOString()})`);
              const deleted = await this.deleteFolder(sessionFolder.id!);
              if (deleted) {
                cleaned++;
              } else {
                errors++;
              }
            }
          }
        }
      }

      console.log(`✅ Temp cleanup completed: ${cleaned} folders cleaned, ${errors} errors`);
      return { cleaned, errors };

    } catch (error: any) {
      console.error('❌ Failed to cleanup temp files:', error.message);
      return { cleaned: 0, errors: 1 };
    }
  }

  /**
   * Find folder by name (helper function)
   */
  async findFolderByName(folderName: string, parentId?: string): Promise<string | null> {
    try {
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      const folders = response.data.files || [];
      return folders.length > 0 ? folders[0].id! : null;
    } catch (error: any) {
      console.error(`❌ Failed to find folder ${folderName}:`, error.message);
      return null;
    }
  }

  /**
   * Create new nested folder structure: اطبعلي/[date]/[customerName]/طلب_[orderNumber]
   */
  async createOrderFolderStructure(
    customerName: string, 
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<{ folderId: string | null; orderNumber: number }> {
    if (!this.isConfigured) {
      return { folderId: null, orderNumber: 1 };
    }

    try {
      console.log(`📁 Creating order folder structure for customer: ${customerName}, date: ${date}`);

      // Step 1: Create or get main "اطبعلي" folder
      const mainFolderId = await this.createFolder('اطبعلي');
      if (!mainFolderId) {
        throw new Error('Failed to create main اطبعلي folder');
      }

      // Step 2: Create or get date folder inside main folder
      const dateFolderId = await this.createFolder(date, mainFolderId);
      if (!dateFolderId) {
        throw new Error(`Failed to create date folder: ${date}`);
      }

      // Step 3: Create or get customer folder inside date folder
      const customerFolderId = await this.createFolder(customerName, dateFolderId);
      if (!customerFolderId) {
        throw new Error(`Failed to create customer folder: ${customerName}`);
      }

      // Step 4: Count existing order folders for this customer today
      const orderNumber = await this.getNextOrderNumber(customerFolderId, customerName);

      // Step 5: Create order folder with number
      const orderFolderName = `طلب_${orderNumber}`;
      const orderFolderId = await this.createFolder(orderFolderName, customerFolderId);
      if (!orderFolderId) {
        throw new Error(`Failed to create order folder: ${orderFolderName}`);
      }

      console.log(`✅ Order folder structure created successfully:`);
      console.log(`   اطبعلي/${date}/${customerName}/${orderFolderName}/`);
      console.log(`   Final folder ID: ${orderFolderId}`);

      return { folderId: orderFolderId, orderNumber };

    } catch (error: any) {
      console.error('❌ Failed to create order folder structure:', error.message);
      return { folderId: null, orderNumber: 1 };
    }
  }

  /**
   * Get next order number for customer on specific date
   */
  async getNextOrderNumber(customerFolderId: string, customerName: string): Promise<number> {
    try {
      // Search for existing order folders in customer folder
      const query = `'${customerFolderId}' in parents and name contains 'طلب_' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)'
      });

      const orderFolders = response.data.files || [];
      
      // Extract order numbers and find the highest
      let maxOrderNumber = 0;
      orderFolders.forEach((folder: any) => {
        const match = folder.name?.match(/طلب_(\d+)/);
        if (match) {
          const orderNum = parseInt(match[1]);
          if (orderNum > maxOrderNumber) {
            maxOrderNumber = orderNum;
          }
        }
      });

      const nextOrderNumber = maxOrderNumber + 1;
      console.log(`📊 Customer ${customerName} - Found ${orderFolders.length} existing orders, next order: ${nextOrderNumber}`);
      
      return nextOrderNumber;

    } catch (error: any) {
      console.error('❌ Failed to get next order number:', error.message);
      return 1; // Default to order 1 if error
    }
  }

  /**
   * Create nested folder structure: اطبعلي/العميل [customerName]/[date] (OLD VERSION)
   */
  async createNestedFolderStructure(
    customerName: string, 
    date: string = new Date().toISOString().split('T')[0]
  ): Promise<string | null> {
    if (!this.isConfigured) {
      return null;
    }

    try {
      console.log(`📁 Creating nested folder structure for customer: ${customerName}, date: ${date}`);

      // Step 1: Create or get main "اطبعلي" folder
      const mainFolderId = await this.createFolder('اطبعلي');
      if (!mainFolderId) {
        throw new Error('Failed to create main اطبعلي folder');
      }

      // Step 2: Create or get customer folder inside main folder
      const customerFolderName = `العميل ${customerName}`;
      const customerFolderId = await this.createFolder(customerFolderName, mainFolderId || undefined);
      if (!customerFolderId) {
        throw new Error(`Failed to create customer folder: ${customerFolderName}`);
      }

      // Step 3: Create or get date folder inside customer folder
      const dateFolderId = await this.createFolder(date, customerFolderId);
      if (!dateFolderId) {
        throw new Error(`Failed to create date folder: ${date}`);
      }

      console.log(`✅ Nested folder structure created successfully:`);
      console.log(`   اطبعلي/${customerFolderName}/${date}/`);
      console.log(`   Final folder ID: ${dateFolderId}`);

      return dateFolderId;

    } catch (error: any) {
      console.error('❌ Failed to create nested folder structure:', error.message);
      return null;
    }
  }

  /**
   * Share folder with specific email address
   */
  async shareFolderWithUser(folderId: string, email: string, role: 'reader' | 'writer' = 'writer'): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      console.log(`🔗 Sharing folder ${folderId} with ${email} as ${role}`);

      await this.drive.permissions.create({
        fileId: folderId,
        resource: {
          role: role,
          type: 'user',
          emailAddress: email
        }
      });

      console.log(`✅ Folder shared successfully with ${email}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to share folder with ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Share all folders in hierarchy with user
   */
  async shareHierarchyWithUser(customerName: string, date: string, email: string): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      console.log(`🔗 Sharing folder hierarchy with ${email} for customer: ${customerName}, date: ${date}`);

      // Get main "اطبعلي" folder
      const mainFolderId = await this.createFolder('اطبعلي');
      if (mainFolderId) {
        await this.shareFolderWithUser(mainFolderId, email, 'reader');
      }

      // Get customer folder
      const customerFolderName = `العميل ${customerName}`;
      const customerFolderId = await this.createFolder(customerFolderName, mainFolderId || undefined);
      if (customerFolderId) {
        await this.shareFolderWithUser(customerFolderId, email, 'writer');
      }

      // Get date folder
      const dateFolderId = await this.createFolder(date, customerFolderId || undefined);
      if (dateFolderId) {
        await this.shareFolderWithUser(dateFolderId, email, 'writer');
      }

      console.log(`✅ Complete folder hierarchy shared with ${email}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Failed to share hierarchy with ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Get folder hierarchy path for display (NEW VERSION)
   */
  getOrderFolderHierarchy(customerName: string, date: string, orderNumber: number): string {
    return `اطبعلي/${date}/${customerName}/طلب_${orderNumber}/`;
  }

  /**
   * Get folder hierarchy path for display (OLD VERSION)
   */
  getFolderHierarchy(customerName: string, date: string): string {
    return `اطبعلي/العميل ${customerName}/${date}/`;
  }

  /**
   * Test connection to Google Drive
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Google Drive not configured'
      };
    }

    try {
      // Try to list files (limit to 1 for testing)
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id, name)'
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService();