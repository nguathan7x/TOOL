import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { createApp } from './app.js';

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Backend server listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
