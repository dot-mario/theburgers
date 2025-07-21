import { DynamicConstants } from '../src/config/DynamicConstants';
import { SupabaseConfigurationService } from '../src/config/SupabaseConfigurationService';
import { DetectionGroup } from '../src/types/database';

// Mock SupabaseConfigurationService
jest.mock('../src/config/SupabaseConfigurationService');

describe('DynamicConstants', () => {
  let dynamicConstants: DynamicConstants;
  let mockConfigService: jest.Mocked<SupabaseConfigurationService>;

  const mockGroups: DetectionGroup[] = [
    {
      id: 'burger-id',
      name: 'burger',
      display_name: '버거',
      characters: ['젖', '버', '거'],
      color: 0xd4b799,
      emoji: '🍔',
      enabled: true,
      threshold: 5
    },
    {
      id: 'chicken-id',
      name: 'chicken',
      display_name: '치킨',
      characters: ['젖', '치', '킨'],
      color: 0xffa500,
      emoji: '🍗',
      enabled: true,
      threshold: 3
    },
    {
      id: 'disabled-id',
      name: 'disabled',
      display_name: '비활성화',
      characters: ['비', '활', '성'],
      color: 0x000000,
      emoji: '❌',
      enabled: false,
      threshold: 10
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfigService = {
      getDetectionGroups: jest.fn(),
      onConfigChange: jest.fn(),
    } as any;

    (SupabaseConfigurationService as jest.MockedClass<typeof SupabaseConfigurationService>)
      .mockImplementation(() => mockConfigService);

    dynamicConstants = new DynamicConstants(mockConfigService);
  });

  describe('initialization', () => {
    it('should register for configuration changes', () => {
      expect(mockConfigService.onConfigChange).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });
  });

  describe('async getter methods', () => {
    it('should load and transform detection groups correctly', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      const characters = await dynamicConstants.getGroupCharacters();
      const colors = await dynamicConstants.getGroupColors();
      const emojis = await dynamicConstants.getGroupEmojis();
      const thresholds = await dynamicConstants.getGroupThresholds();

      // Should only include enabled groups
      expect(Object.keys(characters)).toEqual(['burger', 'chicken']);
      expect(characters.burger).toEqual(['젖', '버', '거']);
      expect(characters.chicken).toEqual(['젖', '치', '킨']);

      expect(colors.burger).toBe(0xd4b799);
      expect(colors.chicken).toBe(0xffa500);

      expect(emojis.burger).toBe('🍔');
      expect(emojis.chicken).toBe('🍗');

      expect(thresholds.burger).toBe(5);
      expect(thresholds.chicken).toBe(3);
    });

    it('should exclude disabled groups', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      const characters = await dynamicConstants.getGroupCharacters();
      expect(characters.disabled).toBeUndefined();
    });

    it('should handle empty groups array', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue([]);

      const characters = await dynamicConstants.getGroupCharacters();
      expect(Object.keys(characters)).toHaveLength(0);
    });

    it('should return default groups on service errors', async () => {
      mockConfigService.getDetectionGroups.mockRejectedValue(new Error('Service error'));

      const characters = await dynamicConstants.getGroupCharacters();
      
      // Should return default groups
      expect(Object.keys(characters)).toEqual(['burger', 'chicken', 'pizza']);
      expect(characters.burger).toEqual(['젖', '버', '거']);
    });
  });

  describe('configuration change handling', () => {
    it('should invalidate cache on configuration change', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      // Load initial data
      await dynamicConstants.getGroupCharacters();

      // Simulate configuration change
      const configChangeCallback = (mockConfigService.onConfigChange as jest.Mock).mock.calls[0][0];
      configChangeCallback();

      // Update mock data
      const updatedGroups = [
        ...mockGroups,
        {
          id: 'pizza-id',
          name: 'pizza',
          display_name: '피자',
          characters: ['젖', '피', '자'],
          color: 0xff0000,
          emoji: '🍕',
          enabled: true,
          threshold: 7
        }
      ];
      mockConfigService.getDetectionGroups.mockResolvedValue(updatedGroups);

      // Next call should get fresh data
      const characters = await dynamicConstants.getGroupCharacters();
      expect(Object.keys(characters)).toEqual(['burger', 'chicken', 'pizza']);
      expect(characters.pizza).toEqual(['젖', '피', '자']);
    });
  });

  describe('specific getter methods', () => {
    beforeEach(() => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);
    });

    it('should return group display names', async () => {
      const displayNames = await dynamicConstants.getGroupDisplayNames();
      expect(displayNames).toEqual({
        burger: '버거',
        chicken: '치킨'
      });
    });

    it('should return enabled group names', async () => {
      const names = await dynamicConstants.getEnabledGroupNames();
      expect(names).toEqual(['burger', 'chicken']);
    });

    it('should return group by name', async () => {
      const group = await dynamicConstants.getGroupByName('burger');
      expect(group).toEqual(mockGroups[0]);
    });

    it('should return null for non-existent group', async () => {
      const group = await dynamicConstants.getGroupByName('nonexistent');
      expect(group).toBeNull();
    });

    it('should return null for disabled group', async () => {
      const group = await dynamicConstants.getGroupByName('disabled');
      expect(group).toBeNull();
    });
  });

  describe('caching', () => {
    it('should cache groups and reuse them within TTL', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      // First call
      await dynamicConstants.getGroupCharacters();
      // Second call should use cache
      await dynamicConstants.getGroupCharacters();

      expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(1);
    });

    it('should use cached data when service fails', async () => {
      // First successful call
      mockConfigService.getDetectionGroups.mockResolvedValueOnce(mockGroups);
      await dynamicConstants.getGroupCharacters();

      // Second call fails but should return cached data
      mockConfigService.getDetectionGroups.mockRejectedValue(new Error('Service failed'));
      const characters = await dynamicConstants.getGroupCharacters();

      expect(Object.keys(characters)).toEqual(['burger', 'chicken']);
    });
  });

  describe('forceRefresh', () => {
    it('should invalidate cache and reload data', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      // Initial load
      await dynamicConstants.getGroupCharacters();

      // Force refresh
      await dynamicConstants.forceRefresh();

      expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(2);
    });
  });

  describe('onConfigChange', () => {
    it('should register callback and prevent duplicates', () => {
      const callback = jest.fn();
      
      // 동일한 콜백을 여러 번 등록
      dynamicConstants.onConfigChange(callback);
      dynamicConstants.onConfigChange(callback);
      dynamicConstants.onConfigChange(callback);

      // 설정 변경 이벤트가 등록되었는지 확인 (한 번만)
      expect(mockConfigService.onConfigChange).toHaveBeenCalledTimes(1);
    });

    it('should execute registered callbacks on config change', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      dynamicConstants.onConfigChange(callback1);
      dynamicConstants.onConfigChange(callback2);

      // 설정 변경 콜백 실행
      const configChangeCallback = (mockConfigService.onConfigChange as jest.Mock).mock.calls[0][0];
      configChangeCallback();

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('data consistency', () => {
    it('should maintain consistency across all getter methods', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

      const names = await dynamicConstants.getEnabledGroupNames();
      const characters = await dynamicConstants.getGroupCharacters();
      const colors = await dynamicConstants.getGroupColors();
      const emojis = await dynamicConstants.getGroupEmojis();
      const thresholds = await dynamicConstants.getGroupThresholds();

      // All objects should have the same keys
      expect(Object.keys(characters).sort()).toEqual(names.sort());
      expect(Object.keys(colors).sort()).toEqual(names.sort());
      expect(Object.keys(emojis).sort()).toEqual(names.sort());
      expect(Object.keys(thresholds).sort()).toEqual(names.sort());
    });
  });
});