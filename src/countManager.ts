// src/countManager.ts
import { EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';
import { DescriptionService } from './descriptionService';
import { DiscordService } from './discordService';
import { ALERT_COOLDOWN_DURATION } from './constants';

export type GroupType = 'burger' | 'chicken' | 'pizza';

export interface GroupCount {
  [letter: string]: number;
}

export class CountManager {
  private groupCounts: Record<GroupType, GroupCount> = {
    burger: { '젖': 0, '버': 0, '거': 0 },
    chicken: { '젖': 0, '치': 0, '킨': 0 },
    pizza: { '젖': 0, '피': 0, '자': 0 }
  };
  private playCount = 0;
  private resetIntervalId: NodeJS.Timeout;
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
    // 1분마다 카운트 초기화
    this.resetIntervalId = setInterval(() => {
      this.resetAllCounts();
    }, 60 * 1000);
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
    switch (group) {
      case 'burger':
        embed.setColor(0xd4b799)
             .setTitle("🍔 젖버거 알림 🍔")
             .setDescription(description)
             .setURL(CONFIG.CHZZK_LIVE_URL);
        break;
      case 'chicken':
        embed.setColor(0xffa500)
             .setTitle("🍗 젖치킨 알림 🍗")
             .setDescription(description)
             .setURL(CONFIG.CHZZK_LIVE_URL);
        break;
      case 'pizza':
        embed.setColor(0xff0000)
             .setTitle("🍕 젖피자 알림 🍕")
             .setDescription(description)
             .setURL(CONFIG.CHZZK_LIVE_URL);
        break;
    }
    return embed;
  }

  private resetGroupCount(group: GroupType): void {
    Object.keys(this.groupCounts[group]).forEach(letter => this.groupCounts[group][letter] = 0);
  }

  private resetAllCounts(): void {
    (Object.keys(this.groupCounts) as GroupType[]).forEach(group => this.resetGroupCount(group));
    this.playCount = 0;
  }

  public cleanup(): void {
    clearInterval(this.resetIntervalId);
  }
}
