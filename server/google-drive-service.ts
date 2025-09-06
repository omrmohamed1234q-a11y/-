import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

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

      const media = {
        mimeType: mimeType,
        body: buffer
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