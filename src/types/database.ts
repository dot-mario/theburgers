// src/types/database.ts
export interface DetectionGroup {
  id: string;
  name: string;
  display_name: string;
  characters: string[];
  alert_messages: string[];
  color: number;
  emoji: string;
  enabled: boolean;
  threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface SystemSetting {
  id: string;
  key_name: string;
  value_data: any;
  updated_at?: string;
}

export interface ConfigurationHistory {
  id: string;
  group_id: string;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  old_data?: DetectionGroup;
  new_data?: DetectionGroup;
  changed_by: string;
  created_at: string;
}

export interface SystemConfig {
  groups: DetectionGroup[];
  globalSettings: {
    countThreshold: number;
    alertCooldown: number;
    countResetInterval: number;
  };
  lastModified: Date;
}

export interface Database {
  public: {
    Tables: {
      detection_groups: {
        Row: DetectionGroup;
        Insert: Omit<DetectionGroup, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DetectionGroup, 'id' | 'created_at' | 'updated_at'>>;
      };
      system_settings: {
        Row: SystemSetting;
        Insert: Omit<SystemSetting, 'id' | 'updated_at'>;
        Update: Partial<Omit<SystemSetting, 'id' | 'updated_at'>>;
      };
      configuration_history: {
        Row: ConfigurationHistory;
        Insert: Omit<ConfigurationHistory, 'id' | 'created_at'>;
        Update: never;
      };
    };
  };
}