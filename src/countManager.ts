// src/countManager.ts
import { EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';
import { DescriptionService } from './descriptionService';
import { DiscordService } from './discordService';
import { ALERT_COOLDOWN_DURATION, COUNT_RESET_INTERVAL, GROUP_CHARACTERS, GROUP_COLORS, GROUP_EMOJIS } from './constants';
import { GroupType, GroupCount, CleanupableService } from './types';
import { IntervalManager } from './utils';

export class CountManager implements CleanupableService {
  private groupCounts: Record<GroupType, GroupCount> = {} as Record<GroupType, GroupCount>;
  private playCount = 0;
  private intervalManager = new IntervalManager();
  private alertCooldowns: Record<GroupType, number> = {
    burger: 0,
    chicken: 0,
    pizza: 0
  };

  constructor(
    private readonly countThreshold: number,
    private readonly descriptionService: DescriptionService,
    private readonly discordService: DiscordService
  ) {
    this.initializeGroupCounts();
    this.intervalManager.createInterval(() => {
      this.resetAllCounts();
    }, COUNT_RESET_INTERVAL);
  }

  private initializeGroupCounts(): void {
    this.groupCounts = {} as Record<GroupType, GroupCount>;
    Object.entries(GROUP_CHARACTERS).forEach(([group, characters]) => {
      this.groupCounts[group as GroupType] = {};
      characters.forEach(char => {
        this.groupCounts[group as GroupType][char] = 0;
      });
    });
  }

  public updateGroupCount(group: GroupType, letter: string): void {
    if (this.groupCounts[group][letter] !== undefined) {
      this.groupCounts[group][letter]++;
      this.checkGroupCounts(group);
    }
  }

  // 그룹의 문자 목록을 외부에서 조회할 수 있도록 제공
  public getGroupLetters(group: GroupType): string[] {
    return Object.keys(this.groupCounts[group]);
  }

  private checkGroupCounts(group: GroupType): void {
    const counts = this.groupCounts[group];
    const allSatisfied = Object.values(counts).every(val => val >= this.countThreshold);
    if (allSatisfied) {
      this.sendGroupAlert(group);
      this.resetGroupCount(group);
    }
  }

  private async sendGroupAlert(group: GroupType) {
    const now = Date.now();
    if (this.alertCooldowns[group] > now) {
      console.log(`[Cooldown] ${group} alert is on cooldown.`);
      return;
    }

    const embed = this.createGroupEmbed(group);
    await this.discordService.sendEmbed(embed, CONFIG.DISCORD_ALERT_CHANNEL_ID);

    // 5분 쿨다운 설정
    this.alertCooldowns[group] = now + ALERT_COOLDOWN_DURATION;
    console.log(`[Cooldown] ${group} alert cooldown started.`);
  }

  private createGroupEmbed(group: GroupType): EmbedBuilder {
    const embed = new EmbedBuilder();
    const description = this.descriptionService.getRandomDescription(group);
    const emoji = GROUP_EMOJIS[group];
    const color = GROUP_COLORS[group];
    const groupName = group === 'burger' ? '버거' : group === 'chicken' ? '치킨' : '피자';
    
    return embed
      .setColor(color)
      .setTitle(`${emoji} 젖${groupName} 알림 ${emoji}`)
      .setDescription(description)
      .setURL(CONFIG.CHZZK_LIVE_URL);
  }

  private resetGroupCount(group: GroupType): void {
    Object.keys(this.groupCounts[group]).forEach(letter => this.groupCounts[group][letter] = 0);
  }

  private resetAllCounts(): void {
    (Object.keys(this.groupCounts) as GroupType[]).forEach(group => this.resetGroupCount(group));
    this.playCount = 0;
  }

  public cleanup(): void {
    this.intervalManager.clearAllIntervals();
  }
}
