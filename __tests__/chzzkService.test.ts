import { ChzzkService } from '../src/chzzkService';
import { DiscordService } from '../src/discordService';
import { CountManager } from '../src/countManager';

// chzzk 모듈을 모킹하여 search 및 chat 메서드의 동작을 정의합니다.
jest.mock('chzzk', () => {
  return {
    ChzzkClient: jest.fn().mockImplementation(() => {
      return {
        search: {
          channels: jest.fn().mockResolvedValue({
            channels: [{ channelId: 'test_channel' }]
          })
        },
        chat: jest.fn().mockImplementation(() => {
          return {
            on: jest.fn(),
            connect: jest.fn().mockResolvedValue(undefined)
          };
        })
      };
    })
  };
});

describe('ChzzkService', () => {
  let chzzkService: ChzzkService;
  let fakeDiscordService: Partial<DiscordService>;
  let fakeCountManager: Partial<CountManager>;

  beforeEach(() => {
    fakeDiscordService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      sendEmbed: jest.fn().mockResolvedValue(undefined)
    };

    fakeCountManager = {
      updateGroupCount: jest.fn(),
    };

    chzzkService = new ChzzkService(fakeCountManager as CountManager, fakeDiscordService as DiscordService);
  });

  afterEach(() => {
    // cleanup() 호출로 타이머 정리
    chzzkService.cleanup();
  });

  it('should start without errors', async () => {
    await expect(chzzkService.start()).resolves.not.toThrow();
  });
});
