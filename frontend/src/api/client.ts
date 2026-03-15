import axios from 'axios';
import { FileGraph, PaginatedResponse, FileNode, UnusedFilesResponse, LargeFilesResponse } from '../types';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const api = {
  // Scan directory and get graph data
  async scanDirectory(path: string, recursive = true, maxDepth = 5): Promise<FileGraph> {
    const response = await client.get('/scan', {
      params: { path, recursive, maxDepth }
    });
    return response.data.data;
  },

  // Get files with filtering and pagination
  async getFiles(
    path: string,
    options: {
      type?: string[];
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedResponse<FileNode>> {
    const response = await client.get('/files', {
      params: {
        path,
        type: options.type?.join(','),
        search: options.search,
        sortBy: options.sortBy,
        sortOrder: options.sortOrder,
        page: options.page,
        limit: options.limit
      }
    });
    return response.data.data;
  },

  // Get file type distribution
  async getFileTypes(path: string): Promise<Record<string, number>> {
    const response = await client.get('/types', {
      params: { path }
    });
    return response.data.data;
  },

  // Get unused files (not accessed in X days)
  async getUnusedFiles(
    path: string,
    options: {
      daysNotAccessed?: number;
      minSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<UnusedFilesResponse> {
    const response = await client.get('/unused', {
      params: {
        path,
        daysNotAccessed: options.daysNotAccessed || 90,
        minSize: options.minSize || 0,
        sortBy: options.sortBy || 'size',
        sortOrder: options.sortOrder || 'desc'
      }
    });
    return response.data.data;
  },

  // Get large files (over X MB)
  async getLargeFiles(
    path: string,
    options: {
      minSizeMB?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<LargeFilesResponse> {
    const response = await client.get('/large', {
      params: {
        path,
        minSizeMB: options.minSizeMB || 100,
        limit: options.limit || 100,
        sortBy: options.sortBy || 'size',
        sortOrder: options.sortOrder || 'desc'
      }
    });
    return response.data.data;
  },

  // Invalidate cache
  async invalidateCache(): Promise<void> {
    await client.post('/invalidate');
  }
};

export default client;
