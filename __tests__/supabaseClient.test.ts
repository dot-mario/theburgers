// __tests__/supabaseClient.test.ts

// Set environment variables before any imports
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock createClient
const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

describe('supabaseClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('module initialization and exports', () => {
    it('should create clients and export them', () => {
      const mockClient = { from: jest.fn() };
      const mockAdminClient = { 
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      };

      mockCreateClient
        .mockReturnValueOnce(mockClient)
        .mockReturnValueOnce(mockAdminClient);

      const module = require('../src/database/supabaseClient');

      expect(mockCreateClient).toHaveBeenCalledTimes(2);
      
      // Check first call (supabase client)
      expect(mockCreateClient).toHaveBeenNthCalledWith(
        1,
        'https://test.supabase.co',
        'test-anon-key'
      );
      
      // Check second call (supabaseAdmin client)
      expect(mockCreateClient).toHaveBeenNthCalledWith(
        2,
        'https://test.supabase.co',
        'test-service-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      expect(module.supabase).toBe(mockClient);
      expect(module.supabaseAdmin).toBe(mockAdminClient);
    });
  });

  describe('testSupabaseConnection', () => {
    it('should return true when connection is successful', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: null
      });

      const mockSelect = jest.fn().mockReturnValue({
        limit: mockLimit
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });

      const mockAdminClient = {
        from: mockFrom
      };

      mockCreateClient
        .mockReturnValueOnce({}) // supabase client
        .mockReturnValueOnce(mockAdminClient); // supabaseAdmin client

      const { testSupabaseConnection } = require('../src/database/supabaseClient');
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const result = await testSupabaseConnection();

      expect(result).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith('detection_groups');
      expect(mockSelect).toHaveBeenCalledWith('id', { count: 'exact', head: true });
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(consoleSpy).toHaveBeenCalledWith('Supabase connection successful');
      
      consoleSpy.mockRestore();
    });

    it('should return false when query returns error', async () => {
      const testError = new Error('Database error');
      
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: testError
      });

      const mockSelect = jest.fn().mockReturnValue({
        limit: mockLimit
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });

      const mockAdminClient = {
        from: mockFrom
      };

      mockCreateClient
        .mockReturnValueOnce({}) // supabase client
        .mockReturnValueOnce(mockAdminClient); // supabaseAdmin client

      const { testSupabaseConnection } = require('../src/database/supabaseClient');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await testSupabaseConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Supabase connection test failed:', testError);
      
      consoleSpy.mockRestore();
    });

    it('should return false and handle exception', async () => {
      const connectionError = new Error('Connection failed');
      const mockFrom = jest.fn().mockImplementation(() => {
        throw connectionError;
      });

      const mockAdminClient = {
        from: mockFrom
      };

      mockCreateClient
        .mockReturnValueOnce({}) // supabase client
        .mockReturnValueOnce(mockAdminClient); // supabaseAdmin client

      const { testSupabaseConnection } = require('../src/database/supabaseClient');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = await testSupabaseConnection();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Supabase connection error:', connectionError);
      
      consoleSpy.mockRestore();
    });
  });
});