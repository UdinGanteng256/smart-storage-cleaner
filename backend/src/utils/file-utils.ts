import * as path from 'path';
import * as mime from 'mime-types';

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.raw', '.cr2', '.nef']);
const documentExtensions = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts']);
const videoExtensions = new Set(['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v']);
const audioExtensions = new Set(['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a']);

export function getFileType(extension: string): FileType {
  const ext = extension.toLowerCase();
  if (imageExtensions.has(ext)) return 'image';
  if (documentExtensions.has(ext)) return 'document';
  if (videoExtensions.has(ext)) return 'video';
  if (audioExtensions.has(ext)) return 'audio';
  return 'other';
}

export function isImageFile(extension: string): boolean {
  return imageExtensions.has(extension.toLowerCase());
}

export function isDocumentFile(extension: string): boolean {
  return documentExtensions.has(extension.toLowerCase());
}

export function sanitizePath(inputPath: string): string {
  // Prevent directory traversal
  const normalized = path.normalize(inputPath);
  if (normalized.includes('..')) {
    throw new Error('Invalid path: directory traversal detected');
  }
  return normalized;
}

export function getMimeType(filePath: string): string {
  return mime.lookup(filePath) || 'application/octet-stream';
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
