// src/countManager.ts
import { EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';
import { DescriptionService } from './descriptionService';
import { DiscordService } from './discordService';
import { ALERT_COOLDOWN_DURATION, COUNT_RESET_INTERVAL } from './constants';
import { CleanupableService } from './types';
import { IntervalManager } from './utils';
import { DynamicConstants } from './config/DynamicConstants';

export class CountManager implements CleanupableService {
  private groupCounts: Record<string, Record<string, number>> = {};
  private playCount = 0;
  private intervalManager = new IntervalManager();
  private alertCooldowns: Record<string, number> = {};
  private enabledGroups: string[] = [];
  private realtimeUpdateCallback?: () => void;
  private configChangeCallback?: () => void;
  private alertInProgress: Set<string> = new Set();

  constructor(
    private readonly countThreshold: number,
    private readonly descriptionService: DescriptionService,
    private readonly discordService: DiscordService,
    private readonly dynamicConstants: DynamicConstants
  ) {
    this.initializeGroupCounts();
    this.intervalManager.createInterval(() => {
      this.resetAllCounts();
    }, COUNT_RESET_INTERVAL);

    // 설정 변경 감지하여 그룹 카운트 재초기화 (중복 방지)
    this.setupConfigChangeListener();
  }

  private async initializeGroupCounts(): Promise<void> {
    try {
      const groupCharacters = await this.dynamicConstants.getGroupCharacters();
      this.enabledGroups = await this.dynamicConstants.getEnabledGroupNames();
      
      this.groupCounts = {};
      this.alertCooldowns = {};

      Object.entries(groupCharacters).forEach(([group, characters]) => {
        this.groupCounts[group] = {};
        this.alertCooldowns[group] = 0;
        
        characters.forEach(char => {
          this.groupCounts[group][char] = 0;
        });
      });

      console.log(`Initialized counts for groups: ${this.enabledGroups.join(', ')}`);
    } catch (error) {
      console.error('Failed to initialize group counts:', error);
      // 폴백: 빈 객체로 초기화
      this.groupCounts = {};
      this.alertCooldowns = {};
      this.enabledGroups = [];
    }
  }

  public async updateGroupCount(group: string, letter: string): Promise<void> {
    // 그룹이 활성화되어 있고 해당 문자가 존재하는지 확인
    if (this.enabledGroups.includes(group) && 
        this.groupCounts[group] && 
        this.groupCounts[group][letter] !== undefined) {
      
      this.groupCounts[group][letter]++;
      await this.checkGroupCounts(group);
      
      // 실시간 업데이트 콜백 호출
      if (this.realtimeUpdateCallback) {
        this.realtimeUpdateCallback();
      }
    }
  }

  // 그룹의 문자 목록을 외부에서 조회할 수 있도록 제공
  public getGroupLetters(group: string): string[] {
    if (!this.groupCounts[group]) {
      return [];
    }
    return Object.keys(this.groupCounts[group]);
  }

  private async checkGroupCounts(group: string): Promise<void> {
    try {
      const groupData = await this.dynamicConstants.getGroupByName(group);
      if (!groupData) return;

      const counts = this.groupCounts[group];
      const threshold = groupData.threshold;
      
      const allSatisfied = Object.values(counts).every(val => val >= threshold);
      if (allSatisfied) {
        await this.sendGroupAlert(group);
        this.resetGroupCount(group);
      }
    } catch (error) {
      console.error(`Failed to check group counts for ${group}:`, error);
    }
  }

  private async sendGroupAlert(group: string): Promise<void> {
    const now = Date.now();
    
    // 중복 알림 방지 - 이미 진행 중인 알림이 있다면 무시
    if (this.alertInProgress.has(group)) {
      console.log(`[Duplicate Prevention] ${group} alert already in progress, skipping.`);
      return;
    }
    
    // 쿨다운 체크
    if (this.alertCooldowns[group] > now) {
      console.log(`[Cooldown] ${group} alert is on cooldown.`);
      return;
    }

    // 알림 진행 상태 설정
    this.alertInProgress.add(group);

    try {
      const embed = await this.createGroupEmbed(group);
      await this.discordService.sendEmbed(embed, CONFIG.DISCORD_ALERT_CHANNEL_ID);

      // 쿨다운 설정
      this.alertCooldowns[group] = now + ALERT_COOLDOWN_DURATION;
      console.log(`[Cooldown] ${group} alert cooldown started.`);
    } catch (error) {
      console.error(`Failed to send alert for ${group}:`, error);
    } finally {
      // 알림 진행 상태 해제
      this.alertInProgress.delete(group);
    }
  }

  private async createGroupEmbed(group: string): Promise<EmbedBuilder> {
    try {
      const embed = new EmbedBuilder();
      const description = this.descriptionService.getRandomDescription(group);
      
      const [emojis, colors, displayNames] = await Promise.all([
        this.dynamicConstants.getGroupEmojis(),
        this.dynamicConstants.getGroupColors(),
        this.dynamicConstants.getGroupDisplayNames()
      ]);

      const emoji = emojis[group] || '🔔';
      const color = colors[group] || 0x000000;
      const displayName = displayNames[group] || group;
      
      return embed
        .setColor(color)
        .setTitle(`${emoji} ${displayName} 알림 ${emoji}`)
        .setDescription(description)
        .setURL(CONFIG.CHZZK_LIVE_URL);
    } catch (error) {
      console.error(`Failed to create embed for ${group}:`, error);
      
      // 폴백 임베드
      return new EmbedBuilder()
        .setColor(0x000000)
        .setTitle(`🔔 ${group} 알림 🔔`)
        .setDescription(`${group} 감지!`)
        .setURL(CONFIG.CHZZK_LIVE_URL);
    }
  }

  private resetGroupCount(group: string): void {
    if (this.groupCounts[group]) {
      Object.keys(this.groupCounts[group]).forEach(letter => {
        this.groupCounts[group][letter] = 0;
      });
      
      // 카운트 리셋 시에도 실시간 업데이트
      if (this.realtimeUpdateCallback) {
        this.realtimeUpdateCallback();
      }
    }
  }

  private resetAllCounts(): void {
    this.enabledGroups.forEach(group => this.resetGroupCount(group));
    this.playCount = 0;
  }

  // 새로운 메서드: 현재 카운트 상태 조회
  public getCurrentCounts(): Record<string, Record<string, number>> {
    return { ...this.groupCounts };
  }

  // 새로운 메서드: 설정 강제 새로고침
  public async refreshConfiguration(): Promise<void> {
    await this.dynamicConstants.forceRefresh();
    await this.initializeGroupCounts();
  }

  // 설정 변경 리스너 설정 (중복 방지)
  private setupConfigChangeListener(): void {
    // 기존 콜백이 있다면 제거
    if (this.configChangeCallback) {
      this.dynamicConstants.offConfigChange(this.configChangeCallback);
    }

    // 새 콜백 등록
    this.configChangeCallback = () => {
      console.log('Configuration changed, reinitializing group counts...');
      this.initializeGroupCounts();
    };

    this.dynamicConstants.onConfigChange(this.configChangeCallback);
  }

  // 실시간 업데이트 콜백 설정
  public setRealtimeUpdateCallback(callback: () => void): void {
    this.realtimeUpdateCallback = callback;
  }

  public cleanup(): void {
    this.intervalManager.clearAllIntervals();
    
    // 설정 변경 리스너 정리
    if (this.configChangeCallback) {
      this.dynamicConstants.offConfigChange(this.configChangeCallback);
      this.configChangeCallback = undefined;
    }
    
    // 진행 중인 알림 상태 정리
    this.alertInProgress.clear();
  }
}