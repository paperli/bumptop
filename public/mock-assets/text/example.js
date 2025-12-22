// BumpTop Example Code
// File System Provider Interface

export interface FileEntry {
  id: string;
  name: string;
  kind: 'image' | 'video' | 'audio' | 'text' | 'unknown';
  sizeBytes?: number;
  modifiedAt?: string;
  mimeType?: string;
  path?: string;
  thumbnailUrl?: string;
}

export interface FileContentHandle {
  url: string;
  mimeType?: string;
}

export interface FileSystemProvider {
  id: string;
  label: string;

  isAuthenticated(): boolean;
  signIn(): Promise<void>;
  signOut(): Promise<void>;

  listFixedFolder(): Promise<FileEntry[]>;
  getFileContent(entry: FileEntry): Promise<FileContentHandle>;
}

// Example Mock Provider Implementation
export class MockProvider implements FileSystemProvider {
  id = 'mock';
  label = 'Mock Files';

  isAuthenticated() {
    return true;
  }

  async signIn() {
    // Mock implementation
  }

  async signOut() {
    // Mock implementation
  }

  async listFixedFolder() {
    return [
      {
        id: '1',
        name: 'sample.txt',
        kind: 'text',
        sizeBytes: 1024,
      },
      // ... more files
    ];
  }

  async getFileContent(entry) {
    return {
      url: `/mock-assets/text/${entry.name}`,
      mimeType: 'text/plain',
    };
  }
}
