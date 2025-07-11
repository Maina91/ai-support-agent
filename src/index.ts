import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/index.js';
import { apiRouter } from './api/routes.js';
import { applyRateLimit, errorHandler, notFoundHandler } from './utils/middleware.js';
import { setupSecurity } from './security/index.js';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express server
const app = express();

// Apply security middleware
setupSecurity(app);

// Apply standard middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://api.openai.com'],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(applyRateLimit);

// API routes
app.use('/api', apiRouter);

// Static files for production build
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));

  // For all GET requests that aren't to /api, serve the React app
  app.get('*', (req, res, next) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    } else {
      next();
    }
  });
}

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.info(`Server running on port ${PORT}`);
});

export default app;