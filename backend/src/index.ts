import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import fileRoutes from './routes/file.routes';
import { errorHandler } from './middleware/error-handler';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow for development
}));

// CORS - restrict to localhost only for security
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', fileRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`
🚀 Photo Organizer Backend running on http://localhost:${PORT}

Available endpoints:
- GET  /health          - Health check
- GET  /api/scan        - Scan directory (query: path, recursive, maxDepth)
- GET  /api/files       - Get files with filter/sort/pagination
- GET  /api/types       - Get file type distribution
- GET  /api/stats       - Get cache stats
- POST /api/invalidate  - Invalidate cache
- GET  /api/unused      - Get unused files (query: path, daysNotAccessed, minSize)
- GET  /api/large       - Get large files (query: path, minSizeMB, limit)
  `);
});

export default app;
