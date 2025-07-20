import { SupabaseMigrationService, runMigration } from '../src/migration/supabaseMigration';
import { supabaseAdmin } from '../src/database/supabaseClient';
import { GROUP_CHARACTERS, GROUP_COLORS, GROUP_EMOJIS } from '../src/constants';

// Mock Supabase client
jest.mock('../src/database/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
    })),
    rpc: jest.fn()
  }
}));

// Mock constants
jest.mock('../src/constants', () => ({
  GROUP_CHARACTERS: {
    burger: ['젖', '버', '거'],
    chicken: ['젖', '치', '킨'],
    pizza: ['젖', '피', '자']
  },
  GROUP_COLORS: {
    burger: 0xd4b799,
    chicken: 0xffa500,
    pizza: 0xff0000
  },
  GROUP_EMOJIS: {
    burger: '🍔',
    chicken: '🍗',
    pizza: '🍕'
  }
}));

describe('SupabaseMigrationService', () => {
  let migrationService: SupabaseMigrationService;
  let mockSupabaseChain: any;

  beforeEach(() => {
    jest.clearAllMocks();
    migrationService = new SupabaseMigrationService();

    mockSupabaseChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
    };

    (supabaseAdmin.from as jest.Mock).mockReturnValue(mockSupabaseChain);
  });

  describe('createTables', () => {
    it('should execute all table creation SQL statements', async () => {
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });

      await migrationService.createTables();

      expect(supabaseAdmin.rpc).toHaveBeenCalledTimes(6);
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('exec_sql', {
        sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS detection_groups')
      });
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('exec_sql', {
        sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS system_settings')
      });
      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('exec_sql', {
        sql: expect.stringContaining('CREATE TABLE IF NOT EXISTS configuration_history')
      });
    });

    it('should handle SQL execution errors gracefully', async () => {
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        error: new Error('SQL execution failed')
      });

      // Should not throw, but should log warnings
      await expect(migrationService.createTables()).resolves.not.toThrow();
    });

    it('should handle RPC function unavailable', async () => {
      (supabaseAdmin.rpc as jest.Mock).mockRejectedValue(new Error('RPC failed'));

      await expect(migrationService.createTables()).rejects.toThrow('RPC failed');
    });
  });

  describe('migrateExistingData', () => {
    it('should migrate groups and settings when none exist', async () => {
      // Mock empty existing data
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: [],
        error: null
      });

      // Mock successful insertion
      mockSupabaseChain.insert.mockResolvedValue({
        data: null,
        error: null
      });

      await migrationService.migrateExistingData();

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'burger',
            display_name: '버거',
            characters: ['젖', '버', '거'],
            color: 0xd4b799,
            emoji: '🍔'
          })
        ])
      );
    });

    it('should skip existing groups during migration', async () => {
      // Mock existing burger group
      mockSupabaseChain.select.mockResolvedValueOnce({
        data: [{ name: 'burger' }],
        error: null
      });

      // Mock successful insertion of remaining groups
      mockSupabaseChain.insert.mockResolvedValue({
        data: null,
        error: null
      });

      await migrationService.migrateExistingData();

      // Should only insert chicken and pizza (burger already exists)
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'chicken' }),
          expect.objectContaining({ name: 'pizza' })
        ])
      );
      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.not.arrayContaining([
          expect.objectContaining({ name: 'burger' })
        ])
      );
    });

    it('should handle migration errors', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      await expect(migrationService.migrateExistingData())
        .rejects.toThrow('Database error');
    });

    it('should migrate system settings', async () => {
      // Mock empty groups and settings
      mockSupabaseChain.select
        .mockResolvedValueOnce({ data: [], error: null }) // groups
        .mockResolvedValueOnce({ data: [], error: null }) // settings
        .mockResolvedValueOnce({ data: [], error: null }); // settings check

      mockSupabaseChain.insert.mockResolvedValue({
        data: null,
        error: null
      });

      await migrationService.migrateExistingData();

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          { key_name: 'countThreshold', value_data: 5 },
          { key_name: 'alertCooldown', value_data: 300000 },
          { key_name: 'countResetInterval', value_data: 60000 }
        ])
      );
    });

    it('should skip existing system settings', async () => {
      // Mock existing settings
      mockSupabaseChain.select
        .mockResolvedValueOnce({ data: [], error: null }) // groups check
        .mockResolvedValueOnce({ 
          data: [{ key_name: 'countThreshold' }], 
          error: null 
        }); // existing settings check

      mockSupabaseChain.insert.mockResolvedValue({
        data: null,
        error: null
      });

      await migrationService.migrateExistingData();

      // Should only insert remaining settings (since countThreshold already exists)
      const settingsCall = (mockSupabaseChain.insert as jest.Mock).mock.calls
        .find(call => call[0][0]?.key_name);

      expect(settingsCall).toBeDefined();
      expect(settingsCall[0]).toEqual(
        expect.arrayContaining([
          { key_name: 'alertCooldown', value_data: 300000 },
          { key_name: 'countResetInterval', value_data: 60000 }
        ])
      );
      expect(settingsCall[0]).toEqual(
        expect.not.arrayContaining([
          { key_name: 'countThreshold', value_data: 5 }
        ])
      );
    });
  });

  describe('verifyMigration', () => {
    it('should return true when verification succeeds', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: [{ count: 3 }],
        error: null
      });

      const result = await migrationService.verifyMigration();

      expect(result).toBe(true);
      expect(supabaseAdmin.from).toHaveBeenCalledWith('detection_groups');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('system_settings');
    });

    it('should return false when verification fails', async () => {
      mockSupabaseChain.select.mockResolvedValue({
        data: null,
        error: new Error('Table not found')
      });

      const result = await migrationService.verifyMigration();

      expect(result).toBe(false);
    });

    it('should handle verification exceptions', async () => {
      mockSupabaseChain.select.mockRejectedValue(new Error('Connection failed'));

      const result = await migrationService.verifyMigration();

      expect(result).toBe(false);
    });
  });

  describe('rollback', () => {
    it('should delete all data from tables', async () => {
      mockSupabaseChain.neq.mockResolvedValue({
        data: null,
        error: null
      });

      await migrationService.rollback();

      expect(supabaseAdmin.from).toHaveBeenCalledWith('configuration_history');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('detection_groups');
      expect(supabaseAdmin.from).toHaveBeenCalledWith('system_settings');
      expect(mockSupabaseChain.delete).toHaveBeenCalledTimes(3);
      expect(mockSupabaseChain.neq).toHaveBeenCalledWith('id', '');
    });

    it('should handle rollback errors', async () => {
      mockSupabaseChain.neq.mockResolvedValue({
        data: null,
        error: new Error('Delete failed')
      });

      await expect(migrationService.rollback()).rejects.toThrow('Delete failed');
    });
  });

  describe('fullReset', () => {
    it('should drop all tables and functions', async () => {
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({ error: null });

      await migrationService.fullReset();

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('exec_sql', {
        sql: expect.stringContaining('DROP TABLE IF EXISTS')
      });
    });

    it('should handle reset errors', async () => {
      (supabaseAdmin.rpc as jest.Mock).mockResolvedValue({
        error: new Error('Drop failed')
      });

      // Should not throw, but should log warnings
      await expect(migrationService.fullReset()).resolves.not.toThrow();
    });
  });

  describe('helper methods', () => {
    it('should generate correct display names', () => {
      const service = new SupabaseMigrationService();
      
      // Access private method through any cast for testing
      const getDisplayName = (service as any).getDisplayName;
      
      expect(getDisplayName('burger')).toBe('버거');
      expect(getDisplayName('chicken')).toBe('치킨');
      expect(getDisplayName('pizza')).toBe('피자');
      expect(getDisplayName('unknown')).toBe('unknown');
    });
  });
});

describe('runMigration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.exit
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should complete migration successfully', async () => {
    // Mock successful migration
    const mockService = {
      createTables: jest.fn().mockResolvedValue(undefined),
      migrateExistingData: jest.fn().mockResolvedValue(undefined),
      verifyMigration: jest.fn().mockResolvedValue(true)
    };

    jest.spyOn(SupabaseMigrationService.prototype, 'createTables')
      .mockImplementation(mockService.createTables);
    jest.spyOn(SupabaseMigrationService.prototype, 'migrateExistingData')
      .mockImplementation(mockService.migrateExistingData);
    jest.spyOn(SupabaseMigrationService.prototype, 'verifyMigration')
      .mockImplementation(mockService.verifyMigration);

    await runMigration();

    expect(mockService.createTables).toHaveBeenCalled();
    expect(mockService.migrateExistingData).toHaveBeenCalled();
    expect(mockService.verifyMigration).toHaveBeenCalled();
  });

  it('should exit on migration failure', async () => {
    jest.spyOn(SupabaseMigrationService.prototype, 'createTables')
      .mockRejectedValue(new Error('Migration failed'));

    await expect(runMigration()).rejects.toThrow('process.exit called');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('should handle verification failure', async () => {
    jest.spyOn(SupabaseMigrationService.prototype, 'createTables')
      .mockResolvedValue(undefined);
    jest.spyOn(SupabaseMigrationService.prototype, 'migrateExistingData')
      .mockResolvedValue(undefined);
    jest.spyOn(SupabaseMigrationService.prototype, 'verifyMigration')
      .mockResolvedValue(false);

    await runMigration();

    // Should not exit on verification failure, just log the issue
    expect(process.exit).not.toHaveBeenCalled();
  });
});