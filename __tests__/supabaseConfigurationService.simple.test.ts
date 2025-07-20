import { SupabaseConfigurationService } from '../src/config/SupabaseConfigurationService';

// Mock Supabase client completely
jest.mock('../src/database/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn(),
    }))
  }
}));

describe('SupabaseConfigurationService - Basic Tests', () => {
  let service: SupabaseConfigurationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SupabaseConfigurationService();
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeInstanceOf(SupabaseConfigurationService);
    });

    it('should have cleanup method', () => {
      expect(typeof service.cleanup).toBe('function');
    });

    it('should have onConfigChange method', () => {
      expect(typeof service.onConfigChange).toBe('function');
    });
  });

  describe('event handling', () => {
    it('should support registering config change listeners', () => {
      const callback = jest.fn();
      service.onConfigChange(callback);

      service.emit('configChanged', { type: 'test', data: {} });

      expect(callback).toHaveBeenCalledWith({ type: 'test', data: {} });
    });
  });

  describe('cleanup', () => {
    it('should remove all event listeners', () => {
      const callback = jest.fn();
      service.onConfigChange(callback);

      service.cleanup();

      service.emit('configChanged', { type: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });
  });
});