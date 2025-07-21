// src/application.ts
import { DiscordService } from './discordService';
import { DescriptionService } from './descriptionService';
import { CountManager } from './countManager';
import { ChzzkService } from './chzzkService';
import { CONFIG } from './config';
import { CleanupableService } from './types';
import { SupabaseConfigurationService } from './config/SupabaseConfigurationService';
import { DynamicConstants } from './config/DynamicConstants';
import { testSupabaseConnection } from './database/supabaseClient';

export class Application {
  private services: CleanupableService[] = [];
  private discordService!: DiscordService;
  private descriptionService!: DescriptionService;
  private countManager!: CountManager;
  private chzzkService!: ChzzkService;
  private configurationService!: SupabaseConfigurationService;
  private dynamicConstants!: DynamicConstants;

  async initialize(): Promise<void> {
    try {
      console.log('Initializing application...');
      
      // Supabase 연결 테스트
      console.log('Testing Supabase connection...');
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.warn('Supabase connection failed, using fallback configuration');
      }

      // 설정 서비스 초기화
      this.configurationService = new SupabaseConfigurationService();
      this.dynamicConstants = new DynamicConstants(this.configurationService);
      
      // 초기 설정 로드
      console.log('Loading initial configuration...');
      await this.configurationService.loadConfiguration();

      this.discordService = new DiscordService();
      await this.discordService.login();
      this.services.push(this.discordService);

      this.descriptionService = new DescriptionService(this.configurationService);
      await this.descriptionService.initialize();
      this.services.push(this.descriptionService);

      this.countManager = new CountManager(
        CONFIG.COUNT_THRESHOLD,
        this.descriptionService,
        this.discordService,
        this.dynamicConstants
      );
      this.services.push(this.countManager);

      this.chzzkService = new ChzzkService(this.countManager, this.discordService, this.dynamicConstants);
      this.services.push(this.chzzkService);

      // 설정 서비스들도 정리 대상에 추가
      this.services.push({
        cleanup: () => this.configurationService.cleanup()
      });
      
      this.services.push({
        cleanup: () => this.dynamicConstants.cleanup()
      });

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

  // 새로운 메서드: 설정 새로고침
  async refreshConfiguration(): Promise<void> {
    try {
      console.log('Refreshing configuration...');
      await this.configurationService.loadConfiguration();
      await this.countManager.refreshConfiguration();
      console.log('Configuration refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh configuration:', error);
      throw error;
    }
  }

  // 새로운 메서드: 설정 서비스 접근자
  getConfigurationService(): SupabaseConfigurationService {
    return this.configurationService;
  }

  getDynamicConstants(): DynamicConstants {
    return this.dynamicConstants;
  }

  getCountManager(): CountManager {
    return this.countManager;
  }
}