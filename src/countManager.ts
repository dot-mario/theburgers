// src/countManager.ts
import { EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';
import { DescriptionService } from './descriptionService';
import { DiscordService } from './discordService';

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

  public updatePlayCount(): void {
    this.playCount++;
    if (this.playCount >= this.countThreshold) {
      this.sendPlayAlert();
      this.playCount = 0;
    }
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
    await this.discordService.sendEmbed(embed, CONFIG.DISCORD_ALERT_CHANNEL_ID);
  }

  private async sendPlayAlert() {
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("⚽ !play 알림 ⚽")
      .setDescription(this.descriptionService.getRandomDescription("!play"))
      .setURL(CONFIG.CHZZK_LIVE_URL);
    await this.discordService.sendEmbed(embed, CONFIG.DISCORD_ALERT_CHANNEL_ID);
  }

  private resetGroupCount(group: GroupType): void {
    Object.keys(this.groupCounts[group]).forEach(letter => this.groupCounts[group][letter] = 0);
  }

  private resetAllCounts(): void {
    (Object.keys(this.groupCounts) as GroupType[]).forEach(group => this.resetGroupCount(group));
    this.playCount = 0;
  }

  // cleanup 메서드: 주기적으로 실행 중인 타이머를 해제합니다.
  public cleanup(): void {
    clearInterval(this.resetIntervalId);
  }
}
