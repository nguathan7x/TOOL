import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { router } from './routes/index.js';

function normalizeOrigin(value) {
  return value.replace(/\/$/, '');
}

const allowedOrigins = env.CLIENT_URLS.map(normalizeOrigin);

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
          return callback(null, true);
        }

        return callback(new Error('Origin is not allowed by CORS'));
      }
    })
  );
  app.use(helmet());
  app.use(morgan('dev'));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

  app.use(router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
