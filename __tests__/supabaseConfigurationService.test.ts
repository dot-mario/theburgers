// __tests__/supabaseConfigurationService.test.ts
import { SupabaseConfigurationService } from '../src/config/SupabaseConfigurationService';
import { supabaseAdmin } from '../src/database/supabaseClient';
import { DetectionGroup, SystemConfig, SystemSetting } from '../src/types/database';

// Mock supabaseAdmin
jest.mock('../src/database/supabaseClient', () => ({
  supabaseAdmin: {
    from: jest.fn()
  }
}));

describe('SupabaseConfigurationService', () => {
  let service: SupabaseConfigurationService;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpsert: jest.Mock;
  let mockDelete: jest.Mock;
  let mockEq: jest.Mock;
  let mockOrder: jest.Mock;
  let mockSingle: jest.Mock;

  const mockDetectionGroup: DetectionGroup = {
    id: 'test-group',
    name: 'test',
    display_name: '테스트',
    characters: ['테', '스', '트'],
    alert_messages: ['테스트 메시지'],
    color: 0xffffff,
    emoji: '🎯',
    enabled: true,
    threshold: 5
  };

  const mockSystemSettings: SystemSetting[] = [
    { id: '1', key_name: 'countThreshold', value_data: 10 },
    { id: '2', key_name: 'alertCooldown', value_data: 300000 },
    { id: '3', key_name: 'countResetInterval', value_data: 120000 }
  ];

  beforeEach(() => {
    service = new SupabaseConfigurationService();
    
    // Reset all mocks
    mockSelect = jest.fn();
    mockInsert = jest.fn();
    mockUpsert = jest.fn();
    mockDelete = jest.fn();
    mockEq = jest.fn();
    mockOrder = jest.fn();
    mockSingle = jest.fn();
    mockFrom = jest.fn();

    (supabaseAdmin.from as jest.Mock) = mockFrom;
  });

  afterEach(() => {
    jest.clearAllMocks();
    service.cleanup();
  });

  describe('loadConfiguration', () => {
    it('should load configuration from database', async () => {
      mockOrder.mockResolvedValue({
        data: [mockDetectionGroup],
        error: null
      });

      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return { select: mockSelect };
        }
        if (table === 'system_settings') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockSystemSettings,
              error: null
            })
          };
        }
        return {};
      });

      const config = await service.loadConfiguration();

      expect(config.groups).toHaveLength(1);
      expect(config.groups[0]).toEqual(mockDetectionGroup);
      expect(config.globalSettings.countThreshold).toBe(10);
      expect(config.globalSettings.alertCooldown).toBe(300000);
      expect(config.globalSettings.countResetInterval).toBe(120000);
    });

    it('should return cached configuration if not expired', async () => {
      // First load
      mockOrder.mockResolvedValue({
        data: [mockDetectionGroup],
        error: null
      });

      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return { select: mockSelect };
        }
        if (table === 'system_settings') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockSystemSettings,
              error: null
            })
          };
        }
        return {};
      });

      const config1 = await service.loadConfiguration();
      
      // Second load should use cache
      const config2 = await service.loadConfiguration();

      expect(config1).toBe(config2);
      expect(mockFrom).toHaveBeenCalledTimes(2); // Only called once for each table in first load
    });

    it('should return default configuration on error', async () => {
      mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      });

      mockFrom.mockReturnValue({ select: mockSelect });

      const config = await service.loadConfiguration();

      expect(config.groups).toHaveLength(3); // Default has 3 groups
      expect(config.groups[0].name).toBe('burger');
      expect(config.globalSettings.countThreshold).toBe(5);
    });
  });

  describe('updateDetectionGroup', () => {
    it('should update detection group successfully', async () => {
      const mockUpsertResult = { error: null };
      mockUpsert.mockResolvedValue(mockUpsertResult);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return { upsert: mockUpsert };
        }
        if (table === 'configuration_history') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const emitSpy = jest.spyOn(service, 'emit');

      await service.updateDetectionGroup(mockDetectionGroup);

      expect(mockUpsert).toHaveBeenCalledWith(mockDetectionGroup, { onConflict: 'id' });
      expect(emitSpy).toHaveBeenCalledWith('configChanged', {
        type: 'group_updated',
        data: mockDetectionGroup
      });
    });

    it('should throw error on update failure', async () => {
      const error = new Error('Update failed');
      mockUpsert.mockResolvedValue({ error });

      mockFrom.mockReturnValue({ upsert: mockUpsert });

      await expect(service.updateDetectionGroup(mockDetectionGroup)).rejects.toThrow('Update failed');
    });
  });

  describe('createDetectionGroup', () => {
    it('should create detection group successfully', async () => {
      const newGroup = { ...mockDetectionGroup };
      delete (newGroup as any).id;

      mockSingle.mockResolvedValue({
        data: mockDetectionGroup,
        error: null
      });

      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return { insert: mockInsert };
        }
        if (table === 'configuration_history') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const emitSpy = jest.spyOn(service, 'emit');

      const result = await service.createDetectionGroup(newGroup);

      expect(result).toEqual(mockDetectionGroup);
      expect(mockInsert).toHaveBeenCalledWith(newGroup);
      expect(emitSpy).toHaveBeenCalledWith('configChanged', {
        type: 'group_created',
        data: mockDetectionGroup
      });
    });

    it('should throw error on creation failure', async () => {
      const error = new Error('Creation failed');
      mockSingle.mockResolvedValue({ data: null, error });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockInsert.mockReturnValue({ select: mockSelect });
      mockFrom.mockReturnValue({ insert: mockInsert });

      const newGroup = { ...mockDetectionGroup };
      delete (newGroup as any).id;

      await expect(service.createDetectionGroup(newGroup)).rejects.toThrow('Creation failed');
    });
  });

  describe('deleteDetectionGroup', () => {
    it('should delete detection group successfully', async () => {
      // Mock for fetching existing group
      mockSingle.mockResolvedValue({
        data: mockDetectionGroup,
        error: null
      });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      // Mock for delete operation
      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return {
            select: mockSelect,
            delete: mockDelete
          };
        }
        if (table === 'configuration_history') {
          return { insert: jest.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      const emitSpy = jest.spyOn(service, 'emit');

      await service.deleteDetectionGroup('test-group');

      expect(mockDeleteEq).toHaveBeenCalledWith('id', 'test-group');
      expect(emitSpy).toHaveBeenCalledWith('configChanged', {
        type: 'group_deleted',
        data: mockDetectionGroup
      });
    });

    it('should handle delete when group not found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: null });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSelect.mockReturnValue({ eq: mockEq });

      const mockDeleteEq = jest.fn().mockResolvedValue({ error: null });
      mockDelete.mockReturnValue({ eq: mockDeleteEq });

      mockFrom.mockReturnValue({
        select: mockSelect,
        delete: mockDelete
      });

      await service.deleteDetectionGroup('non-existent');

      expect(mockDeleteEq).toHaveBeenCalled();
    });
  });

  describe('getDetectionGroups', () => {
    it('should return detection groups from configuration', async () => {
      mockOrder.mockResolvedValue({
        data: [mockDetectionGroup],
        error: null
      });

      mockEq.mockReturnValue({ order: mockOrder });
      mockSelect.mockReturnValue({ eq: mockEq });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'detection_groups') {
          return { select: mockSelect };
        }
        if (table === 'system_settings') {
          return {
            select: jest.fn().mockResolvedValue({
              data: mockSystemSettings,
              error: null
            })
          };
        }
        return {};
      });

      const groups = await service.getDetectionGroups();

      expect(groups).toHaveLength(1);
      expect(groups[0]).toEqual(mockDetectionGroup);
    });
  });

  describe('updateSystemSetting', () => {
    it('should update system setting successfully', async () => {
      mockUpsert.mockResolvedValue({ error: null });

      mockFrom.mockReturnValue({ upsert: mockUpsert });

      const emitSpy = jest.spyOn(service, 'emit');

      await service.updateSystemSetting('countThreshold', 15);

      expect(mockUpsert).toHaveBeenCalledWith(
        { key_name: 'countThreshold', value_data: 15 },
        { onConflict: 'key_name' }
      );
      expect(emitSpy).toHaveBeenCalledWith('configChanged', {
        type: 'setting_updated',
        data: { key: 'countThreshold', value: 15 }
      });
    });

    it('should throw error on setting update failure', async () => {
      const error = new Error('Update failed');
      mockUpsert.mockResolvedValue({ error });

      mockFrom.mockReturnValue({ upsert: mockUpsert });

      await expect(service.updateSystemSetting('countThreshold', 15)).rejects.toThrow('Update failed');
    });
  });

  describe('onConfigChange', () => {
    it('should register event listener for config changes', () => {
      const callback = jest.fn();
      service.onConfigChange(callback);

      service.emit('configChanged', { type: 'test' });

      expect(callback).toHaveBeenCalledWith({ type: 'test' });
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