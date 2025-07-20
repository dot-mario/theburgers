// src/application.ts
import { DiscordService } from './discordService';
import { DescriptionService } from './descriptionService';
import { CountManager } from './countManager';
import { ChzzkService } from './chzzkService';
import { CONFIG } from './config';
import { CleanupableService } from './types';

export class Application {
  private services: CleanupableService[] = [];
  private discordService!: DiscordService;
  private descriptionService!: DescriptionService;
  private countManager!: CountManager;
  private chzzkService!: ChzzkService;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing application...');
      
      this.discordService = new DiscordService();
      await this.discordService.login();
      this.services.push(this.discordService);

      this.descriptionService = new DescriptionService('./config/descriptions.json');
      this.services.push(this.descriptionService);

      this.countManager = new CountManager(
        CONFIG.COUNT_THRESHOLD,
        this.descriptionService,
        this.discordService
      );
      this.services.push(this.countManager);

      this.chzzkService = new ChzzkService(this.countManager, this.discordService);
      this.services.push(this.chzzkService);

      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      await this.cleanup();
      throw error;
    }
  }

  async start(): Promise<void> {
    try {
      console.log('Starting application...');
      await this.chzzkService.start();
      console.log('Application started successfully');
    } catch (error) {
      console.error('Failed to start application:', error);
      await this.cleanup();
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up application...');
    this.services.forEach(service => {
      try {
        service.cleanup();
      } catch (error) {
        console.error('Error during service cleanup:', error);
      }
    });
    this.services = [];
    console.log('Application cleanup completed');
  }

  setupGracefulShutdown(): void {
    const shutdownHandler = () => {
      console.log('Received shutdown signal');
      this.cleanup().then(() => {
        process.exit(0);
      }).catch(error => {
        console.error('Error during shutdown:', error);
        process.exit(1);
      });
    };

    process.on('SIGINT', shutdownHandler);
    process.on('SIGTERM', shutdownHandler);
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      shutdownHandler();
    });
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      shutdownHandler();
    });
  }
}