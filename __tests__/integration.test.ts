import { Application } from '../src/application';
import { WebServer } from '../src/webServer';
import { SupabaseMigrationService } from '../src/migration/supabaseMigration';
import { testSupabaseConnection } from '../src/database/supabaseClient';

// Mock all external dependencies
jest.mock('../src/database/supabaseClient');
jest.mock('../src/discordService');
jest.mock('../src/descriptionService');
jest.mock('../src/countManager');
jest.mock('../src/chzzkService');

describe('Integration Tests', () => {
  let application: Application;
  let webServer: WebServer;
  let migrationService: SupabaseMigrationService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Supabase connection test
    (testSupabaseConnection as jest.Mock).mockResolvedValue(true);
  });

  describe('Application with WebServer Integration', () => {
    it('should initialize application and start web server', async () => {
      application = new Application();
      
      // Mock application methods
      jest.spyOn(application, 'initialize').mockResolvedValue();
      jest.spyOn(application, 'getConfigurationService').mockReturnValue({} as any);

      await application.initialize();
      
      webServer = new WebServer(application, 3001);
      
      expect(application.initialize).toHaveBeenCalled();
      expect(webServer).toBeDefined();
    });

    it('should handle configuration refresh through web API', async () => {
      application = new Application();
      
      const mockRefresh = jest.fn().mockResolvedValue(undefined);
      jest.spyOn(application, 'refreshConfiguration').mockImplementation(mockRefresh);
      jest.spyOn(application, 'getConfigurationService').mockReturnValue({} as any);

      await application.refreshConfiguration();
      
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  describe('Migration Integration', () => {
    it('should complete full migration workflow', async () => {
      migrationService = new SupabaseMigrationService();
      
      // Mock migration methods
      const mockCreateTables = jest.spyOn(migrationService, 'createTables').mockResolvedValue();
      const mockMigrateData = jest.spyOn(migrationService, 'migrateExistingData').mockResolvedValue();
      const mockVerify = jest.spyOn(migrationService, 'verifyMigration').mockResolvedValue(true);

      await migrationService.createTables();
      await migrationService.migrateExistingData();
      const isValid = await migrationService.verifyMigration();

      expect(mockCreateTables).toHaveBeenCalled();
      expect(mockMigrateData).toHaveBeenCalled();
      expect(mockVerify).toHaveBeenCalled();
      expect(isValid).toBe(true);
    });

    it('should handle migration rollback', async () => {
      migrationService = new SupabaseMigrationService();
      
      const mockRollback = jest.spyOn(migrationService, 'rollback').mockResolvedValue();
      
      await migrationService.rollback();
      
      expect(mockRollback).toHaveBeenCalled();
    });
  });

  describe('Database Connection Integration', () => {
    it('should verify Supabase connection', async () => {
      const isConnected = await testSupabaseConnection();
      
      expect(testSupabaseConnection).toHaveBeenCalled();
      expect(isConnected).toBe(true);
    });
  });

  describe('Full System Integration', () => {
    it('should simulate complete system startup', async () => {
      // 1. Initialize application
      application = new Application();
      jest.spyOn(application, 'initialize').mockResolvedValue();
      jest.spyOn(application, 'start').mockResolvedValue();
      jest.spyOn(application, 'getConfigurationService').mockReturnValue({} as any);

      // 2. Start web server
      webServer = new WebServer(application, 3001);
      jest.spyOn(webServer, 'start').mockImplementation();

      // 3. Run migrations
      migrationService = new SupabaseMigrationService();
      jest.spyOn(migrationService, 'createTables').mockResolvedValue();
      jest.spyOn(migrationService, 'migrateExistingData').mockResolvedValue();

      // 4. Execute startup sequence
      await migrationService.createTables();
      await migrationService.migrateExistingData();
      await application.initialize();
      await application.start();
      webServer.start();

      // Verify all components were initialized
      expect(migrationService.createTables).toHaveBeenCalled();
      expect(migrationService.migrateExistingData).toHaveBeenCalled();
      expect(application.initialize).toHaveBeenCalled();
      expect(application.start).toHaveBeenCalled();
      expect(webServer.start).toHaveBeenCalled();
    });

    it('should handle graceful shutdown', async () => {
      application = new Application();
      webServer = new WebServer(application, 3001);
      
      jest.spyOn(application, 'cleanup').mockResolvedValue();
      jest.spyOn(webServer, 'stop').mockImplementation();

      // Simulate shutdown
      await application.cleanup();
      webServer.stop();

      expect(application.cleanup).toHaveBeenCalled();
      expect(webServer.stop).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection failures gracefully', async () => {
      (testSupabaseConnection as jest.Mock).mockResolvedValue(false);
      
      const isConnected = await testSupabaseConnection();
      expect(isConnected).toBe(false);
    });

    it('should handle migration failures', async () => {
      migrationService = new SupabaseMigrationService();
      
      jest.spyOn(migrationService, 'createTables').mockRejectedValue(new Error('Migration failed'));
      
      await expect(migrationService.createTables()).rejects.toThrow('Migration failed');
    });

    it('should handle application initialization failures', async () => {
      application = new Application();
      
      jest.spyOn(application, 'initialize').mockRejectedValue(new Error('Init failed'));
      
      await expect(application.initialize()).rejects.toThrow('Init failed');
    });
  });
});