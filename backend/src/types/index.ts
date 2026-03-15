export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'other';
  extension: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  thumbnailPath?: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface FileConnection {
  source: string;
  target: string;
  strength: number;
  type: 'same-folder' | 'similar-name' | 'same-date' | 'same-type';
}

export interface FileGraph {
  nodes: FileNode[];
  connections: FileConnection[];
}

export interface ScanOptions {
  path: string;
  recursive?: boolean;
  includeHidden?: boolean;
  maxDepth?: number;
}

export interface FilterOptions {
  type?: string[];
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  sizeMin?: number;
  sizeMax?: number;
}

export interface SortOptions {
  field: 'name' | 'size' | 'createdAt' | 'modifiedAt';
  order: 'asc' | 'desc';
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
