import { CountManager } from '../src/countManager';
import { GroupType } from '../src/types';
import { DescriptionService } from '../src/descriptionService';
import { DiscordService } from '../src/discordService';
import { GROUP_CHARACTERS, GROUP_COLORS, GROUP_EMOJIS } from '../src/constants';
import { EmbedBuilder } from 'discord.js';

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

  beforeEach(() => {
    fakeDescriptionService = {
      getRandomDescription: (group: string) => `${group} description`
    };

    fakeDiscordService = {
      sendEmbed: jest.fn().mockResolvedValue(undefined)
    };

    // 임계값 2로 설정하여 테스트 용이성 확보
    countManager = new CountManager(2, fakeDescriptionService as DescriptionService, fakeDiscordService as DiscordService);
  });

  afterEach(() => {
    // 타이머 정리를 위해 cleanup() 호출
    countManager.cleanup();
    jest.resetAllMocks();
  });

  it('should send group alert when group count threshold is reached', async () => {
    // burger 그룹의 각 글자에 대해 임계값(2)만큼 호출
    const burgerChars = GROUP_CHARACTERS.burger;
    burgerChars.forEach(char => {
      for (let i = 0; i < 2; i++) {
        countManager.updateGroupCount('burger', char);
      }
    });

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
    countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
    countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[0]);
    countManager.updateGroupCount('burger', GROUP_CHARACTERS.burger[1]);
    // 세 번째 글자는 임계값에 도달하지 않음

    await new Promise(resolve => setTimeout(resolve, 10));
    expect(fakeDiscordService.sendEmbed).not.toHaveBeenCalled();
  });

  it('should test all group types with their respective characters', async () => {
    const groupTypes: GroupType[] = ['burger', 'chicken', 'pizza'];
    
    for (const groupType of groupTypes) {
      const characters = GROUP_CHARACTERS[groupType];
      
      // 각 그룹의 모든 문자에 대해 임계값만큼 업데이트
      characters.forEach(char => {
        for (let i = 0; i < 2; i++) {
          countManager.updateGroupCount(groupType, char);
        }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 10));
    // 3개 그룹 모두 알림이 발송되어야 함
    expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(3);
  });
});
