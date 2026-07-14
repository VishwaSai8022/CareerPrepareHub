import { exec } from 'child_process';
import { promisify } from 'util';

import app from './src/app.js';
import connectDB from './src/config/db.js';
import { env, validateEnv } from './src/config/env.js';
import logger from './src/logger/index.js';

const execAsync = promisify(exec);

const killPortProcess = async (port) => {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`netstat -ano | findstr :${port} | findstr LISTENING`);
      const lines = stdout.trim().split('\n').filter(Boolean);
      const pids = [...new Set(lines.map((line) => line.trim().split(/\s+/).pop()).filter(Boolean))];
      for (const pid of pids) {
        if (pid !== String(process.pid)) {
          await execAsync(`taskkill /F /PID ${pid}`).catch(() => {});
        }
      }
    } else {
      await execAsync(`fuser -k ${port}/tcp`).catch(() => {});
    }
    // Brief wait for OS to release the port
    await new Promise((resolve) => { setTimeout(resolve, 500); });
  } catch {
    // Port may already be free
  }
};

const startServer = async (retried = false) => {
  try {
    validateEnv();

    try {
      await connectDB();
    } catch (error) {
      logger.warn(`MongoDB connection failed. Starting API in degraded mode: ${error.message}`);
    }

    const server = app.listen(env.port, () => {
      logger.info(`Backend running on http://localhost:${env.port}`);
    });

    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE' && !retried) {
        logger.warn(`Port ${env.port} is busy. Killing old process and retrying...`);
        await killPortProcess(env.port);
        startServer(true);
      } else {
        logger.error(`Failed to start server: ${error.message}`);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
