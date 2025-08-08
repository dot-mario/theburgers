// __tests__/countManager.branch.test.ts
import { CountManager } from '../src/countManager';
import { DescriptionService } from '../src/descriptionService';
import { DiscordService } from '../src/discordService';
import { DynamicConstants } from '../src/config/DynamicConstants';
import { GROUP_CHARACTERS, ALERT_COOLDOWN_DURATION } from '../src/constants';
import { EmbedBuilder } from 'discord.js';

// Mock DynamicConstants
jest.mock('../src/config/DynamicConstants');

jest.mock('discord.js', () => {
  return {
    EmbedBuilder: class {
      data: any = {};
      setColor(color: number) { this.data.color = color; return this; }
      setTitle(title: string) { this.data.title = title; return this; }
      setDescription(description: string) { this.data.description = description; return this; }
      setURL(url: string) { this.data.url = url; return this; }
    }
  };
});

describe('CountManager - Branch Coverage', () => {
  let countManager: CountManager;
  let fakeDescriptionService: Partial<DescriptionService>;
  let fakeDiscordService: Partial<DiscordService>;
  let fakeDynamicConstants: Partial<DynamicConstants>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    fakeDescriptionService = {
      getRandomDescription: (group: string) => `${group} description`
    };

    fakeDiscordService = {
      sendEmbed: jest.fn().mockResolvedValue(undefined)
    };

    fakeDynamicConstants = {
      getGroupCharacters: jest.fn().mockResolvedValue(GROUP_CHARACTERS),
      onConfigChange: jest.fn(),
      offConfigChange: jest.fn(),
      getEnabledGroupNames: jest.fn().mockResolvedValue(['burger', 'chicken', 'pizza']),
      getGroupByName: jest.fn().mockImplementation((name: string) => Promise.resolve({
        id: name,
        name: name,
        threshold: 2,
        enabled: true
      })),
      getGroupEmojis: jest.fn().mockResolvedValue({ burger: '🍔', chicken: '🍗', pizza: '🍕' }),
      getGroupColors: jest.fn().mockResolvedValue({ burger: 0xd4b799, chicken: 0xffa500, pizza: 0xff0000 }),
      getGroupDisplayNames: jest.fn().mockResolvedValue({ burger: '버거', chicken: '치킨', pizza: '피자' }),
      forceRefresh: jest.fn().mockResolvedValue(undefined)
    };

    countManager = new CountManager(
      2, 
      fakeDescriptionService as DescriptionService, 
      fakeDiscordService as DiscordService,
      fakeDynamicConstants as DynamicConstants
    );

    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    countManager.cleanup();
    jest.resetAllMocks();
  });

  describe('initializeGroupCounts error handling', () => {
    it('should handle error when getGroupCharacters fails', async () => {
      const errorConstants = {
        ...fakeDynamicConstants,
        getGroupCharacters: jest.fn().mockRejectedValue(new Error('Failed to load')),
        getEnabledGroupNames: jest.fn().mockResolvedValue(['burger'])
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const errorCountManager = new CountManager(
        2,
        fakeDescriptionService as DescriptionService,
        fakeDiscordService as DiscordService,
        errorConstants as any
      );

      await new Promise(resolve => setTimeout(resolve, 10));

      // Should have empty counts due to error
      expect(errorCountManager.getCurrentCounts()).toEqual({});
      expect(consoleSpy).toHaveBeenCalledWith('Failed to initialize group counts:', expect.any(Error));
      
      consoleSpy.mockRestore();
      errorCountManager.cleanup();
    });
  });

  describe('updateGroupCount branches', () => {
    it('should not update count for disabled group', async () => {
      // Set only burger as enabled
      (fakeDynamicConstants.getEnabledGroupNames as jest.Mock).mockResolvedValue(['burger']);
      
      await countManager.refreshConfiguration();
      await new Promise(resolve => setTimeout(resolve, 10));

      // Try to update disabled group
      await countManager.updateGroupCount('chicken', 'ㅊ');
      
      const counts = countManager.getCurrentCounts();
      expect(counts.chicken?.['ㅊ'] || 0).toBe(0);
    });

    it('should not update count for non-existent group', async () => {
      await countManager.updateGroupCount('nonexistent', 'x');
      
      const counts = countManager.getCurrentCounts();
      expect(counts.nonexistent).toBeUndefined();
    });

    it('should not update count for non-existent letter in group', async () => {
      await countManager.updateGroupCount('burger', 'x');
      
      const counts = countManager.getCurrentCounts();
      expect(counts.burger?.['x']).toBeUndefined();
    });

    it('should trigger realtime callback when set', async () => {
      const realtimeCallback = jest.fn();
      countManager.setRealtimeUpdateCallback(realtimeCallback);

      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
      
      expect(realtimeCallback).toHaveBeenCalled();
    });
  });

  describe('checkGroupCounts branches', () => {
    it('should handle missing group data', async () => {
      (fakeDynamicConstants.getGroupByName as jest.Mock).mockResolvedValue(null);

      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
      
      // Should not throw error
      expect(fakeDiscordService.sendEmbed).not.toHaveBeenCalled();
    });

    it('should handle error in getGroupByName', async () => {
      (fakeDynamicConstants.getGroupByName as jest.Mock).mockRejectedValue(new Error('DB error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
      
      expect(consoleSpy).toHaveBeenCalledWith('Failed to check group counts for burger:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not send alert when not all characters meet threshold', async () => {
      // Only update some characters to threshold
      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
      await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[1]);
      
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(fakeDiscordService.sendEmbed).not.toHaveBeenCalled();
    });
  });

  describe('sendGroupAlert branches', () => {
    it('should respect cooldown period', async () => {
      // First alert
      const characters = GROUP_CHARACTERS.burger;
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(1);

      // Try second alert immediately (should be on cooldown)
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      // Still only 1 call due to cooldown
      expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(1);
    });

    it('should handle error in sendEmbed', async () => {
      (fakeDiscordService.sendEmbed as jest.Mock).mockRejectedValue(new Error('Discord error'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const characters = GROUP_CHARACTERS.burger;
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 50));
      expect(consoleSpy).toHaveBeenCalledWith('Failed to send alert for burger:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createGroupEmbed branches', () => {
    it('should use fallback values when group data is missing', async () => {
      (fakeDynamicConstants.getGroupEmojis as jest.Mock).mockResolvedValue({});
      (fakeDynamicConstants.getGroupColors as jest.Mock).mockResolvedValue({});
      (fakeDynamicConstants.getGroupDisplayNames as jest.Mock).mockResolvedValue({});

      const characters = GROUP_CHARACTERS.burger;
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const embedCall = (fakeDiscordService.sendEmbed as jest.Mock).mock.calls[0][0];
      expect(embedCall.data.title).toContain('🔔'); // Default emoji
      expect(embedCall.data.color).toBe(0x000000); // Default color
    });

    it('should create fallback embed on error', async () => {
      (fakeDynamicConstants.getGroupEmojis as jest.Mock).mockRejectedValue(new Error('Failed'));
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const characters = GROUP_CHARACTERS.burger;
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      
      const embedCall = (fakeDiscordService.sendEmbed as jest.Mock).mock.calls[0][0];
      expect(embedCall.data.title).toBe('🔔 burger 알림 🔔');
      expect(embedCall.data.description).toBe('burger 감지!');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to create embed for burger:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('resetGroupCount branches', () => {
    it('should trigger realtime callback on reset', async () => {
      const realtimeCallback = jest.fn();
      countManager.setRealtimeUpdateCallback(realtimeCallback);

      // Trigger a group reset by reaching threshold
      const characters = GROUP_CHARACTERS.burger;
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount('burger', char);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Should be called multiple times (for updates and reset)
      expect(realtimeCallback).toHaveBeenCalled();
    });

    it('should handle reset for non-existent group', () => {
      // Should not throw error
      expect(() => {
        (countManager as any).resetGroupCount('nonexistent');
      }).not.toThrow();
    });
  });

  describe('getGroupLetters', () => {
    it('should return empty array for non-existent group', () => {
      const letters = countManager.getGroupLetters('nonexistent');
      expect(letters).toEqual([]);
    });
  });

  describe('refreshConfiguration', () => {
    it('should force refresh configuration', async () => {
      await countManager.refreshConfiguration();
      
      expect(fakeDynamicConstants.forceRefresh).toHaveBeenCalled();
      expect(fakeDynamicConstants.getGroupCharacters).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should properly cleanup config change listener', () => {
      countManager.cleanup();
      
      expect(fakeDynamicConstants.offConfigChange).toHaveBeenCalled();
    });
  });
});