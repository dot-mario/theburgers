// src/index.ts
import { Application } from './application';

async function main() {
  const app = new Application();
  
  try {
    app.setupGracefulShutdown();
    await app.initialize();
    await app.start();
  } catch (error) {
    console.error("Application encountered an error during startup:", error);
    process.exit(1);
  }
}

main();
