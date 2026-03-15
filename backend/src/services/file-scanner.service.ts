import * as fs from 'fs/promises';
import * as path from 'path';
import { FileNode, FileConnection, ScanOptions } from '../types';
import { getFileType, isImageFile, generateId, sanitizePath } from '../utils/file-utils';
import { CacheService } from './cache.service';

export class FileScannerService {
  private cache: CacheService;
  private readonly BATCH_SIZE = 100; // Process files in batches
  private readonly MAX_NODES = 1000; // Increased limit for better coverage
  private readonly MAX_CONNECTIONS = 300; // Limit connections for performance

  constructor() {
    this.cache = new CacheService(10); // 10 minutes TTL
  }

  async scanDirectory(options: ScanOptions & { lite?: boolean }): Promise<{ nodes: FileNode[]; connections: FileConnection[] }> {
    const cacheKey = `${options.path}:${options.recursive}:${options.maxDepth}:${options.lite}`;
    const cached = this.cache.get(cacheKey);

    if (cached) {
      console.log(`[Cache] Returning cached result for ${options.path}`);
      return { nodes: cached.nodes, connections: cached.connections };
    }

    const nodes: FileNode[] = [];
    const scannedPaths = new Set<string>();

    console.log(`[Scan] Starting scan of ${options.path} (maxDepth: ${options.maxDepth})`);
    const startTime = Date.now();

    await this.scanRecursive(
      options.path,
      options.path,
      nodes,
      scannedPaths,
      0,
      options.maxDepth || Infinity,
      options.includeHidden || false
    );

    console.log(`[Scan] Found ${nodes.length} files in ${Date.now() - startTime}ms`);

    // Optimize: Sort by size and take largest files for better visualization
    const MAX_NODES = this.MAX_NODES;
    let limitedNodes = nodes;
    if (nodes.length > MAX_NODES) {
      console.log(`[Performance] Limiting from ${nodes.length} to ${MAX_NODES} nodes`);
      // Sort by size (largest first) to show most important files
      limitedNodes = nodes
        .sort((a, b) => b.size - a.size)
        .slice(0, MAX_NODES);
    }

    // Generate connections between files (optimized)
    const connections = this.generateConnectionsOptimized(limitedNodes, options.lite);

    // Cache the result
    this.cache.set(cacheKey, limitedNodes, connections);

    console.log(`[Scan] Complete: ${limitedNodes.length} nodes, ${connections.length} connections in ${Date.now() - startTime}ms`);

    return { nodes: limitedNodes, connections };
  }

  private async scanRecursive(
    rootPath: string,
    currentPath: string,
    nodes: FileNode[],
    scannedPaths: Set<string>,
    depth: number,
    maxDepth: number,
    includeHidden: boolean
  ): Promise<void> {
    if (depth > maxDepth) return;
    if (scannedPaths.has(currentPath)) return;
    scannedPaths.add(currentPath);

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden files unless explicitly included
        if (!includeHidden && entry.name.startsWith('.')) continue;

        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await this.scanRecursive(
            rootPath,
            fullPath,
            nodes,
            scannedPaths,
            depth + 1,
            maxDepth,
            includeHidden
          );
        } else if (entry.isFile()) {
          const node = await this.createFileNode(fullPath, rootPath);
          if (node) {
            nodes.push(node);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning ${currentPath}:`, error);
    }
  }

  private async createFileNode(filePath: string, rootPath: string): Promise<FileNode | null> {
    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath);
      const type = getFileType(ext);

      // Skip system files and very small files
      if (stats.size < 1) return null;

      const node: FileNode = {
        id: generateId(),
        name: path.basename(filePath),
        path: filePath,
        type,
        extension: ext.toLowerCase(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
      };

      // Add metadata for images
      if (type === 'image') {
        // Thumbnail generation will be handled separately
        node.thumbnailPath = `/thumbnails/${node.id}`;
      }

      return node;
    } catch (error) {
      console.error(`Error creating node for ${filePath}:`, error);
      return null;
    }
  }

  private generateConnectionsOptimized(nodes: FileNode[], lite = true): FileConnection[] {
    const connections: FileConnection[] = [];

    // Performance limits
    const MAX_CONNECTIONS = this.MAX_CONNECTIONS;
    const MAX_CONNECTIONS_PER_NODE = lite ? 3 : 5;

    // Group nodes by folder (only top 50 folders by file count)
    const folderGroups = new Map<string, FileNode[]>();
    for (const node of nodes) {
      const folder = path.dirname(node.path);
      if (!folderGroups.has(folder)) {
        folderGroups.set(folder, []);
      }
      folderGroups.get(folder)!.push(node);
    }

    // Sort folders by file count (process largest folders first)
    const sortedFolders = Array.from(folderGroups.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 50); // Only process top 50 folders

    // Create connections within same folder (limited)
    for (const [folder, folderNodes] of sortedFolders) {
      if (connections.length >= MAX_CONNECTIONS) break;
      
      // Limit folder connections based on folder size
      const maxFolderConnections = Math.min(folderNodes.length, lite ? 5 : 10);
      for (let i = 0; i < maxFolderConnections; i++) {
        for (let j = i + 1; j < maxFolderConnections && j <= i + 2; j++) {
          const nodeA = folderNodes[i];
          const nodeB = folderNodes[j];

          connections.push({
            source: nodeA.id,
            target: nodeB.id,
            strength: 0.5,
            type: 'same-folder'
          });

          if (connections.length >= MAX_CONNECTIONS) break;
        }
        if (connections.length >= MAX_CONNECTIONS) break;
      }
    }

    // Create connections by file type (limited, only in non-lite mode)
    if (!lite && connections.length < MAX_CONNECTIONS) {
      const typeGroups = new Map<string, FileNode[]>();
      for (const node of nodes) {
        if (!typeGroups.has(node.type)) {
          typeGroups.set(node.type, []);
        }
        typeGroups.get(node.type)!.push(node);
      }

      // Process only top 5 types by count
      const sortedTypes = Array.from(typeGroups.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 5);

      for (const [type, typeNodes] of sortedTypes) {
        if (connections.length >= MAX_CONNECTIONS) break;
        
        const maxTypeConnections = Math.min(typeNodes.length, 20);
        for (let i = 0; i < maxTypeConnections && i < MAX_CONNECTIONS_PER_NODE * 4; i++) {
          for (let j = i + 1; j < maxTypeConnections && j <= i + MAX_CONNECTIONS_PER_NODE; j++) {
            const nodeA = typeNodes[i];
            const nodeB = typeNodes[j];

            // Skip if already connected
            const exists = connections.some(
              c => (c.source === nodeA.id && c.target === nodeB.id) ||
                   (c.source === nodeB.id && c.target === nodeA.id)
            );

            if (!exists) {
              connections.push({
                source: nodeA.id,
                target: nodeB.id,
                strength: 0.3,
                type: 'same-type'
              });
            }

            if (connections.length >= MAX_CONNECTIONS) break;
          }
          if (connections.length >= MAX_CONNECTIONS) break;
        }
      }
    }

    console.log(`[Performance] Generated ${connections.length} connections for ${nodes.length} nodes`);
    return connections;
  }

  private generateConnections(nodes: FileNode[], lite = true): FileConnection[] {
    return this.generateConnectionsOptimized(nodes, lite);
  }

  invalidateCache(path?: string): void {
    if (path) {
      this.cache.invalidate(path);
    } else {
      this.cache.invalidateAll();
    }
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}
