// src/config/DynamicConstants.ts
import { SupabaseConfigurationService } from './SupabaseConfigurationService';
import { DetectionGroup } from '../types/database';
import { CleanupableService } from '../types';

export class DynamicConstants implements CleanupableService {
  private configService: SupabaseConfigurationService;
  private cachedGroups: Map<string, DetectionGroup> = new Map();
  private lastUpdate: number = 0;
  private readonly CACHE_TTL = 30000; // 30초
  private onConfigChangeCallbacks: (() => void)[] = [];
  private isConfigListenerSetup = false;

  constructor(configService: SupabaseConfigurationService) {
    this.configService = configService;
    
    // 설정 변경 시 캐시 무효화 - 중복 등록 방지
    this.setupConfigChangeListener();
  }

  async getGroupCharacters(): Promise<Record<string, string[]>> {
    const groups = await this.getGroups();
    const result: Record<string, string[]> = {};
    
    groups.forEach(group => {
      if (group.enabled) {
        result[group.name] = group.characters;
      }
    });
    
    return result;
  }

  async getGroupColors(): Promise<Record<string, number>> {
    const groups = await this.getGroups();
    const result: Record<string, number> = {};
    
    groups.forEach(group => {
      if (group.enabled) {
        result[group.name] = group.color;
      }
    });
    
    return result;
  }

  async getGroupEmojis(): Promise<Record<string, string>> {
    const groups = await this.getGroups();
    const result: Record<string, string> = {};
    
    groups.forEach(group => {
      if (group.enabled) {
        result[group.name] = group.emoji;
      }
    });
    
    return result;
  }

  async getGroupDisplayNames(): Promise<Record<string, string>> {
    const groups = await this.getGroups();
    const result: Record<string, string> = {};
    
    groups.forEach(group => {
      if (group.enabled) {
        result[group.name] = group.display_name;
      }
    });
    
    return result;
  }

  async getGroupThresholds(): Promise<Record<string, number>> {
    const groups = await this.getGroups();
    const result: Record<string, number> = {};
    
    groups.forEach(group => {
      if (group.enabled) {
        result[group.name] = group.threshold;
      }
    });
    
    return result;
  }

  async getEnabledGroupNames(): Promise<string[]> {
    const groups = await this.getGroups();
    return groups.filter(group => group.enabled).map(group => group.name);
  }

  async getGroupByName(name: string): Promise<DetectionGroup | null> {
    const groups = await this.getGroups();
    return groups.find(group => group.name === name && group.enabled) || null;
  }

  private async getGroups(): Promise<DetectionGroup[]> {
    // 캐시 확인
    if (this.isValidCache()) {
      return Array.from(this.cachedGroups.values());
    }

    try {
      const groups = await this.configService.getDetectionGroups();
      
      // 캐시 업데이트
      this.cachedGroups.clear();
      groups.forEach(group => {
        this.cachedGroups.set(group.name, group);
      });
      this.lastUpdate = Date.now();
      
      return groups;
    } catch (error) {
      console.error('Failed to load groups from configuration service:', error);
      
      // 캐시된 데이터가 있으면 반환
      if (this.cachedGroups.size > 0) {
        console.warn('Using cached group data due to loading error');
        return Array.from(this.cachedGroups.values());
      }
      
      // 폴백: 기본 그룹 반환
      return this.getDefaultGroups();
    }
  }

  private isValidCache(): boolean {
    return this.cachedGroups.size > 0 && 
           (Date.now() - this.lastUpdate) < this.CACHE_TTL;
  }

  private invalidateCache(): void {
    this.cachedGroups.clear();
    this.lastUpdate = 0;
  }

  private getDefaultGroups(): DetectionGroup[] {
    return [
      {
        id: 'default-burger',
        name: 'burger',
        display_name: '버거',
        characters: ['젖', '버', '거'],
        color: 0xd4b799,
        emoji: '🍔',
        enabled: true,
        threshold: 5
      },
      {
        id: 'default-chicken',
        name: 'chicken',
        display_name: '치킨',
        characters: ['젖', '치', '킨'],
        color: 0xffa500,
        emoji: '🍗',
        enabled: true,
        threshold: 5
      },
      {
        id: 'default-pizza',
        name: 'pizza',
        display_name: '피자',
        characters: ['젖', '피', '자'],
        color: 0xff0000,
        emoji: '🍕',
        enabled: true,
        threshold: 5
      }
    ];
  }

  // 설정 새로고침 강제 실행
  async forceRefresh(): Promise<void> {
    this.invalidateCache();
    await this.getGroups();
  }

  // 설정 변경 리스너 설정 (중복 방지)
  private setupConfigChangeListener(): void {
    // 이미 설정되어 있다면 중복 설정 방지
    if (this.isConfigListenerSetup) {
      return;
    }

    // 새 리스너 등록
    this.configService.onConfigChange(() => {
      this.invalidateCache();
      // 등록된 모든 콜백 실행
      this.onConfigChangeCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error in config change callback:', error);
        }
      });
    });

    this.isConfigListenerSetup = true;
  }

  // 설정 변경 이벤트 리스너 등록 (중복 방지)
  onConfigChange(callback: () => void): void {
    // 중복 등록 방지
    if (!this.onConfigChangeCallbacks.includes(callback)) {
      this.onConfigChangeCallbacks.push(callback);
    }
  }

  // 설정 변경 이벤트 리스너 제거
  offConfigChange(callback: () => void): void {
    const index = this.onConfigChangeCallbacks.indexOf(callback);
    if (index !== -1) {
      this.onConfigChangeCallbacks.splice(index, 1);
    }
  }

  // 리소스 정리
  cleanup(): void {
    this.onConfigChangeCallbacks = [];
    this.isConfigListenerSetup = false;
    this.invalidateCache();
  }
}