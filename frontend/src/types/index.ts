export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  extension: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  accessedAt: string;
  thumbnailPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  // D3 simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

export interface FileConnection {
  source: string | FileNode;
  target: string | FileNode;
  strength: number;
  type: 'same-folder' | 'similar-name' | 'same-date' | 'same-type';
}

export interface FileGraph {
  nodes: FileNode[];
  connections: FileConnection[];
}

export interface FilterOptions {
  type?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const FILE_TYPE_COLORS: Record<string, string> = {
  image: '#FF6B6B',
  document: '#4ECDC4',
  video: '#45B7D1',
  audio: '#96CEB4',
  other: '#FFEAA7'
};

export const FILE_TYPE_ICONS: Record<string, string> = {
  image: '🖼️',
  document: '📄',
  video: '🎬',
  audio: '🎵',
  other: '📦'
};

export interface UnusedFilesResponse {
  files: FileNode[];
  total: number;
  totalSavings: number;
  daysNotAccessed: number;
  minSize: number;
}

export interface LargeFilesResponse {
  files: FileNode[];
  total: number;
  totalSize: number;
  minSize: number;
}

export type ViewMode = 'graph' | 'unused' | 'large';
