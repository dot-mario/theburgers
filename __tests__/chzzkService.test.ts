import { ChzzkService } from '../src/chzzkService';
import { DiscordService } from '../src/discordService';
import { CountManager } from '../src/countManager';
import { DynamicConstants } from '../src/config/DynamicConstants';
import { GROUP_CHARACTERS, BAN_ACTIONS } from '../src/constants';
import { CONFIG } from '../src/config';

// Mock DynamicConstants
jest.mock('../src/config/DynamicConstants');

// chzzk 모듈을 모킹하여 search 및 chat 메서드의 동작을 정의합니다.
const mockChatInstance = {
  on: jest.fn(),
  connect: jest.fn().mockResolvedValue(undefined)
};

const mockChzzkClient = {
  search: {
    channels: jest.fn().mockResolvedValue({
      channels: [{ channelId: 'test_channel' }]
    })
  },
  chat: jest.fn().mockReturnValue(mockChatInstance)
};

jest.mock('chzzk', () => ({
  ChzzkClient: jest.fn().mockImplementation(() => mockChzzkClient)
}));

describe('ChzzkService', () => {
  let chzzkService: ChzzkService;
  let fakeDiscordService: Partial<DiscordService>;
  let fakeCountManager: Partial<CountManager>;
  let fakeDynamicConstants: Partial<DynamicConstants>;

  beforeEach(() => {
    fakeDiscordService = {
      sendMessage: jest.fn().mockResolvedValue(undefined),
      sendEmbed: jest.fn().mockResolvedValue(undefined)
    };

    fakeCountManager = {
      updateGroupCount: jest.fn(),
      getGroupLetters: jest.fn().mockImplementation((group: keyof typeof GROUP_CHARACTERS) => GROUP_CHARACTERS[group])
    };

    fakeDynamicConstants = {
      getGroupCharacters: jest.fn().mockResolvedValue(GROUP_CHARACTERS)
    };

    chzzkService = new ChzzkService(
      fakeCountManager as CountManager, 
      fakeDiscordService as DiscordService,
      fakeDynamicConstants as DynamicConstants
    );
  });

  afterEach(() => {
    // cleanup() 호출로 타이머 정리
    chzzkService.cleanup();
  });

  it('should start without errors', async () => {
    await expect(chzzkService.start()).resolves.not.toThrow();
  });

  describe('chat message processing', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register event handlers when starting', async () => {
      await chzzkService.start();

      expect(mockChatInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockChatInstance.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockChatInstance.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
      expect(mockChatInstance.on).toHaveBeenCalledWith('chat', expect.any(Function));
      expect(mockChatInstance.on).toHaveBeenCalledWith('systemMessage', expect.any(Function));
    });

    it('should process chat messages and update group counts', async () => {
      await chzzkService.start();

      // chat 이벤트 핸들러 가져오기
      const chatHandler = mockChatInstance.on.mock.calls.find((call: any) => call[0] === 'chat')[1];

      // 각 그룹의 문자들을 테스트
      for (const [groupType, characters] of Object.entries(GROUP_CHARACTERS)) {
        for (const char of characters) {
          const mockChatMessage = {
            hidden: false,
            message: char,
            profile: { nickname: 'testUser' }
          };

          await chatHandler(mockChatMessage);
          
          expect(fakeCountManager.updateGroupCount).toHaveBeenCalledWith(groupType, char);
        }
      }
    });

    it('should not process hidden chat messages for counting', async () => {
      await chzzkService.start();

      const chatHandler = mockChatInstance.on.mock.calls.find((call: any) => call[0] === 'chat')[1];
      
      const hiddenMessage = {
        hidden: true,
        message: GROUP_CHARACTERS.burger[0],
        profile: { nickname: 'testUser' }
      };

      const initialCallCount = (fakeCountManager.updateGroupCount as jest.Mock).mock.calls.length;
      chatHandler(hiddenMessage);
      
      // updateGroupCount가 호출되지 않아야 함
      expect(fakeCountManager.updateGroupCount).toHaveBeenCalledTimes(initialCallCount);
    });

    it('should not update count for non-target characters', async () => {
      await chzzkService.start();

      const chatHandler = mockChatInstance.on.mock.calls.find((call: any) => call[0] === 'chat')[1];
      
      const nonTargetMessage = {
        hidden: false,
        message: '일반메시지',
        profile: { nickname: 'testUser' }
      };

      const initialCallCount = (fakeCountManager.updateGroupCount as jest.Mock).mock.calls.length;
      chatHandler(nonTargetMessage);
      
      expect(fakeCountManager.updateGroupCount).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('system message processing', () => {
    let systemMessageHandler: Function;

    beforeEach(async () => {
      jest.clearAllMocks();
      await chzzkService.start();
      systemMessageHandler = mockChatInstance.on.mock.calls.find((call: any) => call[0] === 'systemMessage')[1];
    });

    it('should process ban system messages', async () => {
      const banMessage = {
        extras: {
          description: '관리자님이 사용자님을 활동 제한 처리했습니다'
        }
      };

      await systemMessageHandler(banMessage);

      expect(fakeDiscordService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('[밴]'),
        expect.any(String)
      );
    });

    it('should process temp ban system messages', async () => {
      const tempBanMessage = {
        extras: {
          description: '모더레이터님이 사용자님을 임시 제한 처리했습니다'
        }
      };

      await systemMessageHandler(tempBanMessage);

      expect(fakeDiscordService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('[임차]'),
        expect.any(String)
      );
    });

    it('should process unban system messages', async () => {
      const unbanMessage = {
        extras: {
          description: '관리자님이 사용자님을 활동 제한을 해제했습니다'
        }
      };

      await systemMessageHandler(unbanMessage);

      expect(fakeDiscordService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('[석방]'),
        expect.any(String)
      );
    });

    it('should include ban initiator info when not done by streamer', async () => {
      const banMessage = {
        extras: {
          description: '관리자님이 사용자님을 활동 제한 처리했습니다'
        }
      };

      await systemMessageHandler(banMessage);

      expect(fakeDiscordService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('(banned by <관리자>)'),
        expect.any(String)
      );
    });

    it('should not include ban initiator info when done by streamer', async () => {
      // CONFIG.STREAMER로 설정된 스트리머가 밴을 실행한 경우
      const banMessage = {
        extras: {
          description: `${CONFIG.STREAMER}님이 사용자님을 활동 제한 처리했습니다`
        }
      };

      await systemMessageHandler(banMessage);

      expect(fakeDiscordService.sendMessage).toHaveBeenCalledWith(
        expect.not.stringContaining('banned by'),
        expect.any(String)
      );
    });

    it('should handle invalid system message format gracefully', async () => {
      const invalidMessage = {
        extras: {
          description: '잘못된 형식의 메시지입니다'
        }
      };

      // 에러 없이 처리되어야 함
      expect(() => systemMessageHandler(invalidMessage)).not.toThrow();
      
      // Discord 메시지는 발송되지 않아야 함
      expect(fakeDiscordService.sendMessage).not.toHaveBeenCalled();
    });
  });
});
