import { Request, Response, NextFunction } from 'express';
import { FileScannerService } from '../services/file-scanner.service';
import { FilterOptions, SortOptions, PaginatedResponse, FileNode } from '../types';
import { ValidationError, NotFoundError } from '../utils/errors';
import * as path from 'path';
import * as fs from 'fs/promises';

export class FileController {
  constructor(private fileScanner: FileScannerService) {}

  scanDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path: scanPath, recursive = true, maxDepth = 5, lite = 'true' } = req.query;

      if (!scanPath || typeof scanPath !== 'string') {
        throw new ValidationError('Path is required');
      }

      // Validate path exists
      try {
        await fs.access(scanPath);
      } catch {
        throw new NotFoundError(`Path not found: ${scanPath}`);
      }

      const result = await this.fileScanner.scanDirectory({
        path: scanPath,
        recursive: recursive === 'true',
        maxDepth: parseInt(maxDepth as string, 10) || 5,
        lite: lite === 'true'
      });

      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        path: scanPath = process.env.HOME || process.env.USERPROFILE || '.',
        type,
        search,
        sortBy = 'name',
        sortOrder = 'asc',
        page = '1',
        limit = '50'
      } = req.query;

      if (typeof scanPath !== 'string') {
        throw new ValidationError('Invalid path');
      }

      // Get all files
      const { nodes } = await this.fileScanner.scanDirectory({
        path: scanPath,
        recursive: true,
        maxDepth: 5
      });

      // Apply filters
      let filtered = [...nodes];

      // Filter by type
      if (type) {
        const types = (type as string).split(',');
        filtered = filtered.filter(node => types.includes(node.type));
      }

      // Filter by search
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(node =>
          node.name.toLowerCase().includes(searchLower) ||
          node.path.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      const sortField = sortBy as 'name' | 'size' | 'createdAt' | 'modifiedAt';
      const sortDir = sortOrder as 'asc' | 'desc';

      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'modifiedAt':
            comparison = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
            break;
        }
        return sortDir === 'asc' ? comparison : -comparison;
      });

      // Apply pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 50;
      const start = (pageNum - 1) * limitNum;
      const end = start + limitNum;
      const paginated = filtered.slice(start, end);

      const response: PaginatedResponse<FileNode> = {
        data: paginated,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filtered.length,
          pages: Math.ceil(filtered.length / limitNum)
        }
      };

      res.json({
        status: 'success',
        data: response
      });
    } catch (error) {
      next(error);
    }
  };

  getFileTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path: scanPath = process.env.HOME || process.env.USERPROFILE || '.' } = req.query;

      if (typeof scanPath !== 'string') {
        throw new ValidationError('Invalid path');
      }

      const { nodes } = await this.fileScanner.scanDirectory({
        path: scanPath,
        recursive: true,
        maxDepth: 5
      });

      // Count by type
      const typeCount = nodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        status: 'success',
        data: typeCount
      });
    } catch (error) {
      next(error);
    }
  };

  getStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = this.fileScanner.getCacheStats();
      res.json({
        status: 'success',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  invalidateCache = async (req: Request, res: Response, next: NextFunction) => {
    try {
      this.fileScanner.invalidateCache();
      res.json({
        status: 'success',
        message: 'Cache invalidated'
      });
    } catch (error) {
      next(error);
    }
  };

  getUnusedFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        path: scanPath = process.env.HOME || process.env.USERPROFILE || '.',
        daysNotAccessed = '90',
        minSize = '0',
        sortBy = 'size',
        sortOrder = 'desc'
      } = req.query;

      if (typeof scanPath !== 'string') {
        throw new ValidationError('Invalid path');
      }

      const days = parseInt(daysNotAccessed as string, 10) || 90;
      const minSizeBytes = parseInt(minSize as string, 10) || 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get all files
      const { nodes } = await this.fileScanner.scanDirectory({
        path: scanPath,
        recursive: true,
        maxDepth: 10
      });

      // Filter unused files: not accessed in X days OR very old files
      const unusedFiles = nodes.filter(node => {
        const accessedAt = new Date(node.accessedAt);
        const isNotAccessed = accessedAt < cutoffDate;
        const isLargeEnough = node.size >= minSizeBytes;
        return isNotAccessed && isLargeEnough;
      });

      // Sort by size (largest first by default) or by access date
      const sortField = sortBy as 'size' | 'accessedAt' | 'name';
      const sortDir = sortOrder as 'asc' | 'desc';

      unusedFiles.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'size':
            comparison = a.size - b.size;
            break;
          case 'accessedAt':
            comparison = new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime();
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
        }
        return sortDir === 'asc' ? comparison : -comparison;
      });

      // Calculate potential space savings
      const totalSavings = unusedFiles.reduce((sum, file) => sum + file.size, 0);

      res.json({
        status: 'success',
        data: {
          files: unusedFiles,
          total: unusedFiles.length,
          totalSavings,
          daysNotAccessed: days,
          minSize: minSizeBytes
        }
      });
    } catch (error) {
      next(error);
    }
  };

  getLargeFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        path: scanPath = process.env.HOME || process.env.USERPROFILE || '.',
        minSizeMB = '100',
        limit = '100',
        sortBy = 'size',
        sortOrder = 'desc'
      } = req.query;

      if (typeof scanPath !== 'string') {
        throw new ValidationError('Invalid path');
      }

      const minSizeBytes = parseInt(minSizeMB as string, 10) * 1024 * 1024;
      const limitNum = parseInt(limit as string, 10) || 100;

      // Get all files
      const { nodes } = await this.fileScanner.scanDirectory({
        path: scanPath,
        recursive: true,
        maxDepth: 10
      });

      // Filter large files
      const largeFiles = nodes
        .filter(node => node.size >= minSizeBytes)
        .sort((a, b) => b.size - a.size)
        .slice(0, limitNum);

      // Calculate total size
      const totalSize = largeFiles.reduce((sum, file) => sum + file.size, 0);

      res.json({
        status: 'success',
        data: {
          files: largeFiles,
          total: largeFiles.length,
          totalSize,
          minSize: minSizeBytes
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
