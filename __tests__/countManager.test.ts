import { CountManager } from '../src/countManager';
import { GroupType } from '../src/types';
import { DescriptionService } from '../src/descriptionService';
import { DiscordService } from '../src/discordService';
import { DynamicConstants } from '../src/config/DynamicConstants';
import { GROUP_CHARACTERS, GROUP_COLORS, GROUP_EMOJIS } from '../src/constants';
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

describe('CountManager', () => {
  let countManager: CountManager;
  let fakeDescriptionService: Partial<DescriptionService>;
  let fakeDiscordService: Partial<DiscordService>;
  let fakeDynamicConstants: Partial<DynamicConstants>;

  beforeEach(async () => {
    // Mock functions 리셋
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
      }))
    };

    // 임계값 2로 설정하여 테스트 용이성 확보
    countManager = new CountManager(
      2, 
      fakeDescriptionService as DescriptionService, 
      fakeDiscordService as DiscordService,
      fakeDynamicConstants as DynamicConstants
    );

    // 초기화가 완료될 때까지 대기
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    // 타이머 정리를 위해 cleanup() 호출
    countManager.cleanup();
    jest.resetAllMocks();
  });

  it('should send group alert when group count threshold is reached', async () => {
    // burger 그룹의 각 글자에 대해 임계값(2)만큼 호출
    const burgerChars = GROUP_CHARACTERS.burger;
    for (const char of burgerChars) {
      for (let i = 0; i < 2; i++) {
        await countManager.updateGroupCount('burger', char);
      }
    }

    // 비동기 작업이 완료될 시간을 잠깐 기다립니다.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(1);
  });

  it('should return correct group letters from constants', () => {
    const burgerLetters = countManager.getGroupLetters('burger');
    const chickenLetters = countManager.getGroupLetters('chicken');
    const pizzaLetters = countManager.getGroupLetters('pizza');

    expect(burgerLetters).toEqual(GROUP_CHARACTERS.burger);
    expect(chickenLetters).toEqual(GROUP_CHARACTERS.chicken);
    expect(pizzaLetters).toEqual(GROUP_CHARACTERS.pizza);
  });

  it('should not send alert if threshold not reached for all characters', async () => {
    // burger 그룹에서 일부 글자만 임계값에 도달
    await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
    await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
    await countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[1]);
    // 세 번째 글자는 임계값에 도달하지 않음

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(fakeDiscordService.sendEmbed).not.toHaveBeenCalled();
  });

  it('should test all group types with their respective characters', async () => {
    const groupTypes: GroupType[] = ['burger', 'chicken', 'pizza'];
    
    for (const groupType of groupTypes) {
      const characters = GROUP_CHARACTERS[groupType];
      
      // 각 그룹의 모든 문자에 대해 임계값만큼 업데이트
      for (const char of characters) {
        for (let i = 0; i < 2; i++) {
          await countManager.updateGroupCount(groupType, char);
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    // 3개 그룹 모두 알림이 발송되어야 함
    expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(3);
  });

  it('should prevent duplicate alerts for same group', async () => {
    // Mock sendEmbed to simulate async delay
    const sendEmbedMock = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 50))
    );
    fakeDiscordService.sendEmbed = sendEmbedMock;

    // burger 그룹 임계값 도달
    const characters = GROUP_CHARACTERS.burger;
    for (const char of characters) {
      for (let i = 0; i < 2; i++) {
        await countManager.updateGroupCount('burger', char);
      }
    }

    // 동시에 여러 번 임계값 체크 (중복 상황 시뮬레이션)
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(countManager.updateGroupCount('burger', characters[0]));
    }
    
    await Promise.all(promises);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 중복 방지로 인해 한 번만 호출되어야 함
    expect(sendEmbedMock).toHaveBeenCalledTimes(1);
  });

  it('should handle config change listener properly without duplicates', async () => {
    // 새로운 mock 객체 생성
    const newOnConfigChangeMock = jest.fn();
    const newOffConfigChangeMock = jest.fn();
    
    const newFakeDynamicConstants = {
      getGroupCharacters: jest.fn().mockResolvedValue(GROUP_CHARACTERS),
      onConfigChange: newOnConfigChangeMock,
      offConfigChange: newOffConfigChangeMock,
      getEnabledGroupNames: jest.fn().mockResolvedValue(['burger', 'chicken', 'pizza']),
      getGroupByName: jest.fn().mockImplementation((name: string) => Promise.resolve({
        id: name,
        name: name,
        threshold: 2,
        enabled: true
      }))
    };

    // 새로운 CountManager 인스턴스 생성하여 설정 변경 리스너 테스트
    const newCountManager = new CountManager(
      2,
      fakeDescriptionService as DescriptionService,
      fakeDiscordService as DiscordService,
      newFakeDynamicConstants as unknown as DynamicConstants
    );

    // 설정 변경 리스너가 등록되었는지 확인
    expect(newOnConfigChangeMock).toHaveBeenCalledTimes(1);

    // cleanup 호출 시 리스너가 제거되는지 확인
    newCountManager.cleanup();
    expect(newOffConfigChangeMock).toHaveBeenCalledTimes(1);
  });
});
