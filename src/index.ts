// src/index.ts
import { Application } from './application';
import { WebServer } from './webServer';
import dotenv from 'dotenv';

// 환경변수 로드
dotenv.config();

async function main() {
  const app = new Application();
  
  try {
    app.setupGracefulShutdown();
    await app.initialize();
    await app.start();

    // 웹 서버 시작 (선택적)
    const webPort = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 3000;
    if (process.env.ENABLE_WEB_SERVER !== 'false') {
      const webServer = new WebServer(app, webPort);
      webServer.start();
      console.log(`Web configuration interface available at http://localhost:${webPort}`);
    }

  } catch (error) {
    console.error("Application encountered an error during startup:", error);
    process.exit(1);
  }
}

main();