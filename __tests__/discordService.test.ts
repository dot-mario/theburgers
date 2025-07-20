import { DiscordService } from '../src/discordService';
import { EmbedBuilder } from 'discord.js';

// discord.js 모듈을 모킹합니다.
const mockSend = jest.fn().mockResolvedValue('전송 성공');
const mockChannelFetch = jest.fn();
const mockLogin = jest.fn().mockResolvedValue('로그인 성공');
const mockDestroy = jest.fn();

jest.mock('discord.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        login: mockLogin,
        channels: {
          fetch: mockChannelFetch,
        },
        user: { tag: '테스트#1234' },
        destroy: mockDestroy,
      };
    }),
    GatewayIntentBits: {
      Guilds: 'GUILDS',
      GuildMessages: 'GUILD_MESSAGES',
    },
    TextChannel: class {},
    EmbedBuilder: class {
      data: any = {};
      setColor(color: number) { this.data.color = color; return this; }
      setTitle(title: string) { this.data.title = title; return this; }
      setDescription(description: string) { this.data.description = description; return this; }
      setURL(url: string) { this.data.url = url; return this; }
    },
  };
});

describe('DiscordService', () => {
  let discordService: DiscordService;

  beforeEach(() => {
    jest.clearAllMocks();
    discordService = new DiscordService();
  });

  afterEach(() => {
    discordService.cleanup();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      await expect(discordService.login()).resolves.not.toThrow();
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });

    it('should handle login errors', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Login failed'));
      
      await expect(discordService.login()).rejects.toThrow('Login failed');
    });
  });

  describe('sendEmbed', () => {
    beforeEach(() => {
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => true,
        send: mockSend,
      });
    });

    it('should send embed successfully', async () => {
      const embed = new EmbedBuilder();
      embed.setTitle('Test Title').setDescription('Test Description');
      
      await discordService.sendEmbed(embed, 'test_channel_id');
      
      expect(mockChannelFetch).toHaveBeenCalledWith('test_channel_id');
      expect(mockSend).toHaveBeenCalledWith({ embeds: [embed] });
    });

    it('should handle channel not found', async () => {
      mockChannelFetch.mockResolvedValue(null);
      
      const embed = new EmbedBuilder();
      await discordService.sendEmbed(embed, 'invalid_channel_id');
      
      expect(mockChannelFetch).toHaveBeenCalledWith('invalid_channel_id');
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle non-text channel', async () => {
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => false,
      });
      
      const embed = new EmbedBuilder();
      await discordService.sendEmbed(embed, 'voice_channel_id');
      
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle send errors gracefully', async () => {
      mockSend.mockRejectedValueOnce(new Error('Send failed'));
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => true,
        send: mockSend,
      });
      
      const embed = new EmbedBuilder();
      
      // 에러가 throw되지 않고 gracefully handle되어야 함
      await expect(discordService.sendEmbed(embed, 'test_channel_id')).resolves.not.toThrow();
    });

    it('should handle channel fetch errors gracefully', async () => {
      mockChannelFetch.mockRejectedValueOnce(new Error('Fetch failed'));
      
      const embed = new EmbedBuilder();
      
      await expect(discordService.sendEmbed(embed, 'test_channel_id')).resolves.not.toThrow();
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    beforeEach(() => {
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => true,
        send: mockSend,
      });
    });

    it('should send text message successfully', async () => {
      const message = 'Test message';
      
      await discordService.sendMessage(message, 'test_channel_id');
      
      expect(mockChannelFetch).toHaveBeenCalledWith('test_channel_id');
      expect(mockSend).toHaveBeenCalledWith(message);
    });

    it('should handle channel not found for messages', async () => {
      mockChannelFetch.mockResolvedValue(null);
      
      await discordService.sendMessage('Test message', 'invalid_channel_id');
      
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('should handle message send errors gracefully', async () => {
      mockSend.mockRejectedValueOnce(new Error('Message send failed'));
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => true,
        send: mockSend,
      });
      
      await expect(discordService.sendMessage('Test', 'test_channel_id')).resolves.not.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should destroy client on cleanup', () => {
      discordService.cleanup();
      expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple cleanup calls', () => {
      discordService.cleanup();
      discordService.cleanup();
      
      expect(mockDestroy).toHaveBeenCalledTimes(2);
    });
  });

  describe('integration', () => {
    it('should handle complete flow from login to message send', async () => {
      mockChannelFetch.mockResolvedValue({
        isTextBased: () => true,
        send: mockSend,
      });

      await discordService.login();
      
      const embed = new EmbedBuilder().setTitle('Integration Test');
      await discordService.sendEmbed(embed, 'test_channel');
      
      await discordService.sendMessage('Integration test message', 'test_channel');
      
      discordService.cleanup();

      expect(mockLogin).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(2);
      expect(mockDestroy).toHaveBeenCalled();
    });
  });
});
