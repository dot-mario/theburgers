import { CountManager, GroupType } from '../src/countManager';
import { DescriptionService } from '../src/descriptionService';
import { DiscordService } from '../src/discordService';
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
    // 예를 들어, burger 그룹의 각 글자 ('젖', '버', '거')에 대해 2회씩 호출
    countManager.updateGroupCount('burger', '젖');
    countManager.updateGroupCount('burger', '젖');
    countManager.updateGroupCount('burger', '버');
    countManager.updateGroupCount('burger', '버');
    countManager.updateGroupCount('burger', '거');
    countManager.updateGroupCount('burger', '거');

    // 비동기 작업이 완료될 시간을 잠깐 기다립니다.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(fakeDiscordService.sendEmbed).toHaveBeenCalledTimes(1);
  });
});
