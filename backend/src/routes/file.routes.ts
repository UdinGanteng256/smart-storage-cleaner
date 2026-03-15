import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { FileScannerService } from '../services/file-scanner.service';

const router = Router();
const fileScanner = new FileScannerService();
const fileController = new FileController(fileScanner);

// Scan directory and return graph data
router.get('/scan', fileController.scanDirectory);

// Get files with filtering, sorting, and pagination
router.get('/files', fileController.getFiles);

// Get file type distribution
router.get('/types', fileController.getFileTypes);

// Get cache stats
router.get('/stats', fileController.getStats);

// Invalidate cache
router.post('/invalidate', fileController.invalidateCache);

// Get unused files (not accessed in X days)
router.get('/unused', fileController.getUnusedFiles);

// Get large files (over X MB)
router.get('/large', fileController.getLargeFiles);

export default router;
