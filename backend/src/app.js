import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config/env.js';
import { morganStream } from './logger/index.js';
import { ApiError, errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { apiRateLimiter, authRateLimiter } from './middleware/rateLimit.middleware.js';
import aptitudeRoutes from './routes/aptitude.routes.js';
import authRoutes from './routes/auth.routes.js';
import codingRoutes from './routes/coding.routes.js';
import contentRoutes from './routes/content.routes.js';
import executionRoutes from './routes/execution.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '../../frontend');

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (env.corsOrigins.length === 0 && env.nodeEnv !== 'production') {
      return callback(null, true);
    }

    if (env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ApiError('Origin not allowed by CORS', 403, 'CORS_ORIGIN_DENIED'));
  },
  credentials: true,
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Allow Google Identity Services script + Monaco Editor CDN
        scriptSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://apis.google.com',
          'https://cdnjs.cloudflare.com',
          // Allow inline scripts that the GSI library injects
          "'unsafe-inline'",
          // Monaco Editor uses eval for syntax highlighting workers
          "'unsafe-eval'",
        ],
        workerSrc: ["'self'", 'blob:'],
        // Allow Google's OAuth iframe (used by the popup flow)
        frameSrc: [
          "'self'",
          'https://accounts.google.com',
        ],
        // Allow fetch/XHR to Google token endpoints and your own backend
        connectSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://oauth2.googleapis.com',
        ],
        // Allow Google profile pictures in <img> tags
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
      },
    },
  }),
);
app.use(hpp());
app.use(cors(corsOptions));
app.use(morgan('combined', { stream: morganStream }));
app.use(express.json({ limit: env.requestBodyLimit }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);
app.use(express.static(frontendRoot));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerPrepHub API is running',
  });
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api', executionRoutes);
app.use('/api/user', userRoutes);

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendRoot, 'pages', 'home.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
