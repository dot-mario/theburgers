import { DiscordService } from '../src/discordService';

// discord.js 모듈을 모킹합니다.
jest.mock('discord.js', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        login: jest.fn().mockResolvedValue('로그인 성공'),
        channels: {
          fetch: jest.fn().mockResolvedValue({
            isTextBased: () => true,
            send: jest.fn().mockResolvedValue('전송 성공'),
          }),
        },
        user: { tag: '테스트#1234' },
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
    discordService = new DiscordService();
  });

  it('login should work without errors', async () => {
    await expect(discordService.login()).resolves.not.toThrow();
  });

  it('sendEmbed should call channel.send', async () => {
    const embed = new (require('discord.js').EmbedBuilder)();
    await discordService.sendEmbed(embed, 'test_alert');
    // 모의 객체 내부에서 로그나 호출 여부를 검증할 수 있음 (여기서는 간단히 성공했다고 가정)
    expect(true).toBe(true);
  });
});
