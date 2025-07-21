// src/config/SupabaseConfigurationService.ts
import { supabaseAdmin } from '../database/supabaseClient';
import { DetectionGroup, SystemConfig, SystemSetting } from '../types/database';
import { EventEmitter } from 'events';

export class SupabaseConfigurationService extends EventEmitter {
  private configCache: SystemConfig | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_TTL = 30000; // 30초

  constructor() {
    super();
  }

  async loadConfiguration(): Promise<SystemConfig> {
    // 캐시 확인
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return this.configCache;
    }

    try {
      // detection_groups 조회
      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('detection_groups')
        .select('*')
        .eq('enabled', true)
        .order('created_at');

      if (groupsError) throw groupsError;

      // system_settings 조회
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .select('*');

      if (settingsError) throw settingsError;

      const config: SystemConfig = {
        groups: groups || [],
        globalSettings: this.parseSettings(settings || []),
        lastModified: new Date()
      };

      // 캐시 업데이트
      this.configCache = config;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;

      console.log(`Loaded ${config.groups.length} detection groups from Supabase`);
      return config;
    } catch (error) {
      console.error('Failed to load configuration from Supabase:', error);
      
      // 폴백: 기본 설정 반환
      return this.getDefaultConfiguration();
    }
  }

  async updateDetectionGroup(group: DetectionGroup): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('detection_groups')
        .upsert(group, { onConflict: 'id' });

      if (error) throw error;

      // 변경 이력 저장
      await this.saveConfigurationHistory('UPDATE', group);
      
      // 캐시 무효화
      this.invalidateCache();
      
      // 이벤트 발생
      this.emit('configChanged', { type: 'group_updated', data: group });
      
      console.log(`Updated detection group: ${group.name}`);
    } catch (error) {
      console.error('Failed to update detection group:', error);
      throw error;
    }
  }

  async createDetectionGroup(group: Omit<DetectionGroup, 'id'>): Promise<DetectionGroup> {
    try {
      const { data, error } = await supabaseAdmin
        .from('detection_groups')
        .insert(group)
        .select()
        .single();

      if (error) throw error;

      await this.saveConfigurationHistory('CREATE', data);
      this.invalidateCache();
      
      // 이벤트 발생
      this.emit('configChanged', { type: 'group_created', data });
      
      console.log(`Created detection group: ${data.name}`);
      return data;
    } catch (error) {
      console.error('Failed to create detection group:', error);
      throw error;
    }
  }

  async deleteDetectionGroup(id: string): Promise<void> {
    try {
      // 삭제 전 데이터 조회 (이력용)
      const { data: existing } = await supabaseAdmin
        .from('detection_groups')
        .select('*')
        .eq('id', id)
        .single();

      const { error } = await supabaseAdmin
        .from('detection_groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (existing) {
        await this.saveConfigurationHistory('DELETE', existing);
        // 이벤트 발생
        this.emit('configChanged', { type: 'group_deleted', data: existing });
        console.log(`Deleted detection group: ${existing.name}`);
      }
      
      this.invalidateCache();
    } catch (error) {
      console.error('Failed to delete detection group:', error);
      throw error;
    }
  }

  async getDetectionGroups(): Promise<DetectionGroup[]> {
    const config = await this.loadConfiguration();
    return config.groups;
  }

  async updateSystemSetting(key: string, value: any): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({ 
          key_name: key, 
          value_data: value 
        }, { onConflict: 'key_name' });

      if (error) throw error;

      this.invalidateCache();
      this.emit('configChanged', { type: 'setting_updated', data: { key, value } });
      
      console.log(`Updated system setting: ${key}`);
    } catch (error) {
      console.error('Failed to update system setting:', error);
      throw error;
    }
  }

  private async saveConfigurationHistory(
    changeType: 'CREATE' | 'UPDATE' | 'DELETE',
    data: DetectionGroup
  ): Promise<void> {
    try {
      await supabaseAdmin
        .from('configuration_history')
        .insert({
          group_id: data.id,
          change_type: changeType,
          new_data: data,
          changed_by: 'system' // 실제로는 인증된 사용자 정보를 사용
        });
    } catch (error) {
      console.error('Failed to save configuration history:', error);
      // 이력 저장 실패는 치명적이지 않으므로 에러를 던지지 않음
    }
  }

  private parseSettings(settings: SystemSetting[]) {
    const defaultSettings = {
      countThreshold: 5,
      alertCooldown: 5 * 60 * 1000, // 5분
      countResetInterval: 60 * 1000, // 1분
    };

    const parsedSettings = { ...defaultSettings };

    settings.forEach(setting => {
      switch (setting.key_name) {
        case 'countThreshold':
          parsedSettings.countThreshold = setting.value_data;
          break;
        case 'alertCooldown':
          parsedSettings.alertCooldown = setting.value_data;
          break;
        case 'countResetInterval':
          parsedSettings.countResetInterval = setting.value_data;
          break;
      }
    });

    return parsedSettings;
  }

  private getDefaultConfiguration(): SystemConfig {
    return {
      groups: [
        {
          id: 'default-burger',
          name: 'burger',
          display_name: '버거',
          characters: ['젖', '버', '거'],
          alert_messages: ['송재욱 버거 뿌린다 ㅋㅋ'],
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
          alert_messages: ['송재욱 치킨 뿌린다 ㅋㅋ'],
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
          alert_messages: ['송재욱 피자 뿌린다 ㅋㅋ'],
          color: 0xff0000,
          emoji: '🍕',
          enabled: true,
          threshold: 5
        }
      ],
      globalSettings: {
        countThreshold: 5,
        alertCooldown: 5 * 60 * 1000,
        countResetInterval: 60 * 1000,
      },
      lastModified: new Date()
    };
  }

  private invalidateCache(): void {
    this.configCache = null;
    this.cacheExpiry = 0;
  }

  // 설정 변경 이벤트 리스너 등록
  onConfigChange(callback: (change: any) => void): void {
    this.on('configChanged', callback);
  }

  // 리소스 정리
  cleanup(): void {
    this.removeAllListeners();
  }
}