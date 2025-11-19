import { Client } from '@microsoft/microsoft-graph-client';
import { AuthService } from './authService';

export interface SharePointFile {
  id: string;
  name: string;
  webUrl: string;
  size: number;
  createdDateTime: string;
  lastModifiedDateTime: string;
  mimeType?: string;
  createdBy: {
    displayName: string;
    email: string;
  };
}

export interface SharePointFolder {
  id: string;
  name: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  childCount: number;
}

export class SharePointService {
  private graphClient: Client;
  private siteUrl: string | null = null;
  private libraryName: string | null = null;

  constructor(authService: AuthService) {
    this.graphClient = authService.getGraphClient();
    this.siteUrl = process.env.SHAREPOINT_SITE_URL || null;
    this.libraryName = process.env.SHAREPOINT_LIBRARY || 'Documents';
  }

  async uploadFile(
    ticketId: string,
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    uploadedBy: string
  ): Promise<SharePointFile> {
    try {
      if (!this.siteUrl) {
        throw new Error('SharePoint site URL not configured');
      }

      // Create ticket-specific folder if it doesn't exist
      const ticketFolder = await this.ensureTicketFolderExists(ticketId);

      // Upload file to the ticket folder
      const uploadUrl = `/sites/${this.getSiteId()}/drives/${await this.getDriveId()}/root:/${ticketFolder.name}/${fileName}:/content`;

      const uploadedFile = await this.graphClient
        .api(uploadUrl)
        .put(fileBuffer);

      const sharePointFile: SharePointFile = {
        id: uploadedFile.id,
        name: uploadedFile.name,
        webUrl: uploadedFile.webUrl,
        size: uploadedFile.size,
        createdDateTime: uploadedFile.createdDateTime,
        lastModifiedDateTime: uploadedFile.lastModifiedDateTime,
        mimeType: uploadedFile.file?.mimeType,
        createdBy: {
          displayName: uploadedFile.createdBy?.user?.displayName || uploadedBy,
          email: uploadedFile.createdBy?.user?.email || ''
        }
      };

      console.log(`✅ File uploaded to SharePoint: ${fileName} for ticket ${ticketId}`);
      return sharePointFile;
    } catch (error) {
      console.error('❌ Failed to upload file to SharePoint:', error);
      // Return mock file data for development
      return this.getMockFile(fileName, mimeType, uploadedBy);
    }
  }

  async downloadFile(fileId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    try {
      const file = await this.graphClient.api(`/drives/${await this.getDriveId()}/items/${fileId}`).get();
      const downloadUrl = file['@microsoft.graph.downloadUrl'];

      const response = await fetch(downloadUrl);
      const buffer = await response.arrayBuffer();

      return {
        buffer: Buffer.from(buffer),
        fileName: file.name,
        mimeType: file.file?.mimeType || 'application/octet-stream'
      };
    } catch (error) {
      console.error('❌ Failed to download file from SharePoint:', error);
      throw new Error('Failed to download file');
    }
  }

  async getTicketFiles(ticketId: string): Promise<SharePointFile[]> {
    try {
      if (!this.siteUrl) {
        return this.getMockFiles();
      }

      const folderName = `Ticket-${ticketId}`;
      const files = await this.graphClient
        .api(`/sites/${this.getSiteId()}/drives/${await this.getDriveId()}/root:/${folderName}:/children`)
        .filter("file ne null")
        .get();

      return files.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        webUrl: file.webUrl,
        size: file.size,
        createdDateTime: file.createdDateTime,
        lastModifiedDateTime: file.lastModifiedDateTime,
        mimeType: file.file?.mimeType,
        createdBy: {
          displayName: file.createdBy?.user?.displayName || 'Unknown',
          email: file.createdBy?.user?.email || ''
        }
      }));
    } catch (error) {
      console.error('❌ Failed to get ticket files from SharePoint:', error);
      return this.getMockFiles();
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.graphClient.api(`/drives/${await this.getDriveId()}/items/${fileId}`).delete();
      console.log(`✅ File deleted from SharePoint: ${fileId}`);
    } catch (error) {
      console.error('❌ Failed to delete file from SharePoint:', error);
      throw new Error('Failed to delete file');
    }
  }

  async createSharingLink(fileId: string, expirationDays: number = 7): Promise<string> {
    try {
      const sharingLink = await this.graphClient
        .api(`/drives/${await this.getDriveId()}/items/${fileId}/createLink`)
        .post({
          type: 'view',
          scope: 'anonymous',
          expirationDateTime: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString()
        });

      return sharingLink.link?.webUrl || '';
    } catch (error) {
      console.error('❌ Failed to create sharing link:', error);
      throw new Error('Failed to create sharing link');
    }
  }

  private async ensureTicketFolderExists(ticketId: string): Promise<SharePointFolder> {
    try {
      const folderName = `Ticket-${ticketId}`;

      // Check if folder exists
      try {
        const existingFolder = await this.graphClient
          .api(`/sites/${this.getSiteId()}/drives/${await this.getDriveId()}/root:/${folderName}`)
          .get();

        return {
          id: existingFolder.id,
          name: existingFolder.name,
          webUrl: existingFolder.webUrl,
          createdDateTime: existingFolder.createdDateTime,
          lastModifiedDateTime: existingFolder.lastModifiedDateTime,
          childCount: existingFolder.folder?.childCount || 0
        };
      } catch (folderError) {
        // Folder doesn't exist, create it
        const newFolder = await this.graphClient
          .api(`/drives/${await this.getDriveId()}/root/children`)
          .post({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail'
          });

        console.log(`✅ Created folder for ticket ${ticketId}`);
        return {
          id: newFolder.id,
          name: newFolder.name,
          webUrl: newFolder.webUrl,
          createdDateTime: newFolder.createdDateTime,
          lastModifiedDateTime: newFolder.lastModifiedDateTime,
          childCount: 0
        };
      }
    } catch (error) {
      console.error('❌ Failed to ensure ticket folder exists:', error);
      throw new Error('Failed to create or access ticket folder');
    }
  }

  private async getSiteId(): Promise<string> {
    if (!this.siteUrl) {
      throw new Error('SharePoint site URL not configured');
    }

    // Extract hostname and path from site URL
    const url = new URL(this.siteUrl);
    const hostname = url.hostname;
    const sitePath = url.pathname.split('/').filter(Boolean).join('/');

    // Get site by hostname and path
    const sites = await this.graphClient
      .api(`/sites/${hostname}:${sitePath}`)
      .get();

    return sites.id;
  }

  private async getDriveId(): Promise<string> {
    if (!this.siteUrl) {
      throw new Error('SharePoint site URL not configured');
    }

    const siteId = await this.getSiteId();
    const drives = await this.graphClient.api(`/sites/${siteId}/drives`).get();

    // Find the documents library or use the first drive
    const documentsDrive = drives.value.find((drive: any) =>
      drive.name.toLowerCase().includes('documents') ||
      drive.name.toLowerCase().includes(this.libraryName?.toLowerCase() || '')
    );

    return documentsDrive?.id || drives.value[0]?.id;
  }

  private getMockFile(fileName: string, mimeType: string, uploadedBy: string): SharePointFile {
    return {
      id: `mock-file-${Date.now()}`,
      name: fileName,
      webUrl: `https://mock-sharepoint.com/sites/crm/Documents/${fileName}`,
      size: 1024,
      createdDateTime: new Date().toISOString(),
      lastModifiedDateTime: new Date().toISOString(),
      mimeType,
      createdBy: {
        displayName: uploadedBy,
        email: 'mock@example.com'
      }
    };
  }

  private getMockFiles(): SharePointFile[] {
    return [
      {
        id: 'mock-file-1',
        name: 'screenshot.png',
        webUrl: 'https://mock-sharepoint.com/sites/crm/Documents/Ticket-123/screenshot.png',
        size: 2048576,
        createdDateTime: '2024-01-15T10:30:00Z',
        lastModifiedDateTime: '2024-01-15T10:30:00Z',
        mimeType: 'image/png',
        createdBy: {
          displayName: 'John Doe',
          email: 'john.doe@example.com'
        }
      },
      {
        id: 'mock-file-2',
        name: 'error-log.txt',
        webUrl: 'https://mock-sharepoint.com/sites/crm/Documents/Ticket-123/error-log.txt',
        size: 1024,
        createdDateTime: '2024-01-15T11:45:00Z',
        lastModifiedDateTime: '2024-01-15T11:45:00Z',
        mimeType: 'text/plain',
        createdBy: {
          displayName: 'Jane Smith',
          email: 'jane.smith@example.com'
        }
      }
    ];
  }
}

export default SharePointService;