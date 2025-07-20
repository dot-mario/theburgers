// src/migration/supabaseMigration.ts
import { supabaseAdmin } from '../database/supabaseClient';
import { GROUP_CHARACTERS, GROUP_COLORS, GROUP_EMOJIS } from '../constants';

export class SupabaseMigrationService {
  async createTables(): Promise<void> {
    console.log('Creating Supabase tables...');

    try {
      // detection_groups 테이블 생성
      const createDetectionGroupsTable = `
        CREATE TABLE IF NOT EXISTS detection_groups (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          characters JSONB NOT NULL,
          color INTEGER NOT NULL,
          emoji TEXT NOT NULL,
          enabled BOOLEAN DEFAULT true,
          threshold INTEGER DEFAULT 5,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // system_settings 테이블 생성
      const createSystemSettingsTable = `
        CREATE TABLE IF NOT EXISTS system_settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key_name TEXT NOT NULL UNIQUE,
          value_data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // configuration_history 테이블 생성
      const createConfigHistoryTable = `
        CREATE TABLE IF NOT EXISTS configuration_history (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          group_id UUID REFERENCES detection_groups(id) ON DELETE CASCADE,
          change_type TEXT NOT NULL,
          old_data JSONB,
          new_data JSONB,
          changed_by TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // updated_at 트리거 함수 생성
      const createUpdatedAtFunction = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
      `;

      // updated_at 트리거 생성
      const createUpdatedAtTriggers = `
        DROP TRIGGER IF EXISTS update_detection_groups_updated_at ON detection_groups;
        CREATE TRIGGER update_detection_groups_updated_at
          BEFORE UPDATE ON detection_groups
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
        CREATE TRIGGER update_system_settings_updated_at
          BEFORE UPDATE ON system_settings
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;

      // RLS 정책 설정
      const setupRLS = `
        ALTER TABLE detection_groups ENABLE ROW LEVEL SECURITY;
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
        ALTER TABLE configuration_history ENABLE ROW LEVEL SECURITY;

        -- 모든 사용자가 읽기 가능
        DROP POLICY IF EXISTS "Enable read access for all users" ON detection_groups;
        CREATE POLICY "Enable read access for all users" ON detection_groups
          FOR SELECT USING (true);

        DROP POLICY IF EXISTS "Enable read access for all users" ON system_settings;
        CREATE POLICY "Enable read access for all users" ON system_settings
          FOR SELECT USING (true);

        -- 서비스 롤은 모든 작업 가능 (서버에서 사용)
        DROP POLICY IF EXISTS "Enable all operations for service role" ON detection_groups;
        CREATE POLICY "Enable all operations for service role" ON detection_groups
          FOR ALL USING (auth.role() = 'service_role');

        DROP POLICY IF EXISTS "Enable all operations for service role" ON system_settings;
        CREATE POLICY "Enable all operations for service role" ON system_settings
          FOR ALL USING (auth.role() = 'service_role');

        DROP POLICY IF EXISTS "Enable all operations for service role" ON configuration_history;
        CREATE POLICY "Enable all operations for service role" ON configuration_history
          FOR ALL USING (auth.role() = 'service_role');
      `;

      // 테이블들을 순서대로 생성
      await this.executeSQL(createDetectionGroupsTable);
      await this.executeSQL(createSystemSettingsTable);
      await this.executeSQL(createConfigHistoryTable);
      await this.executeSQL(createUpdatedAtFunction);
      await this.executeSQL(createUpdatedAtTriggers);
      await this.executeSQL(setupRLS);

      console.log('Tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  async migrateExistingData(): Promise<void> {
    console.log('Starting migration of existing data to Supabase...');

    try {
      // 기존 하드코딩된 데이터를 Supabase로 마이그레이션
      const groups = Object.entries(GROUP_CHARACTERS).map(([key, characters]) => ({
        name: key,
        display_name: this.getDisplayName(key),
        characters: characters,
        color: GROUP_COLORS[key as keyof typeof GROUP_COLORS],
        emoji: GROUP_EMOJIS[key as keyof typeof GROUP_EMOJIS],
        enabled: true,
        threshold: 5
      }));

      // 기존 그룹들이 있는지 확인
      const { data: existingGroups, error: selectError } = await supabaseAdmin
        .from('detection_groups')
        .select('name');

      if (selectError) {
        throw selectError;
      }

      const existingNames = new Set(existingGroups?.map(g => g.name) || []);

      // 존재하지 않는 그룹들만 추가
      const newGroups = groups.filter(group => !existingNames.has(group.name));

      if (newGroups.length > 0) {
        const { error } = await supabaseAdmin
          .from('detection_groups')
          .insert(newGroups);

        if (error) {
          throw error;
        }

        console.log(`Migrated ${newGroups.length} detection groups`);
      } else {
        console.log('All groups already exist, skipping group migration');
      }

      // 시스템 설정 마이그레이션
      await this.migrateSystemSettings();

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async migrateSystemSettings(): Promise<void> {
    const defaultSettings = [
      { key_name: 'countThreshold', value_data: 5 },
      { key_name: 'alertCooldown', value_data: 5 * 60 * 1000 }, // 5분
      { key_name: 'countResetInterval', value_data: 60 * 1000 }, // 1분
    ];

    // 기존 설정들이 있는지 확인
    const { data: existingSettings, error: selectError } = await supabaseAdmin
      .from('system_settings')
      .select('key_name');

    if (selectError) {
      throw selectError;
    }

    const existingKeys = new Set(existingSettings?.map(s => s.key_name) || []);

    // 존재하지 않는 설정들만 추가
    const newSettings = defaultSettings.filter(setting => !existingKeys.has(setting.key_name));

    if (newSettings.length > 0) {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .insert(newSettings);

      if (error) {
        throw error;
      }

      console.log(`Migrated ${newSettings.length} system settings`);
    } else {
      console.log('All system settings already exist, skipping settings migration');
    }
  }

  private getDisplayName(key: string): string {
    const displayNames: Record<string, string> = {
      burger: '버거',
      chicken: '치킨',
      pizza: '피자'
    };
    return displayNames[key] || key;
  }

  private async executeSQL(sql: string): Promise<void> {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
    if (error) {
      console.error('SQL execution failed:', error);
      // RPC 함수가 없을 수 있으므로 직접 실행 시도
      // 이는 Supabase CLI나 SQL 에디터에서 직접 실행해야 할 수도 있습니다
      console.warn('Please execute the following SQL manually in Supabase SQL editor:');
      console.log(sql);
    }
  }

  async verifyMigration(): Promise<boolean> {
    try {
      // 테이블 존재 확인
      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('detection_groups')
        .select('count()');

      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .select('count()');

      if (groupsError || settingsError) {
        console.error('Verification failed:', groupsError || settingsError);
        return false;
      }

      console.log('Migration verification successful:');
      console.log(`- Detection groups: ${groups?.[0]?.count || 0}`);
      console.log(`- System settings: ${settings?.[0]?.count || 0}`);

      return true;
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  async rollback(): Promise<void> {
    console.log('Rolling back migration...');
    
    try {
      // 데이터 삭제 (테이블은 유지) - 모든 데이터 삭제
      const { error: configHistoryError } = await supabaseAdmin
        .from('configuration_history')
        .delete()
        .neq('id', '');
      if (configHistoryError) throw configHistoryError;

      const { error: groupsError } = await supabaseAdmin
        .from('detection_groups')
        .delete()
        .neq('id', '');
      if (groupsError) throw groupsError;

      const { error: settingsError } = await supabaseAdmin
        .from('system_settings')
        .delete()
        .neq('id', '');
      if (settingsError) throw settingsError;
      
      console.log('Rollback completed');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async fullReset(): Promise<void> {
    console.log('Performing full reset...');
    
    try {
      // 테이블 완전 삭제
      const dropTables = `
        DROP TABLE IF EXISTS configuration_history CASCADE;
        DROP TABLE IF EXISTS detection_groups CASCADE;
        DROP TABLE IF EXISTS system_settings CASCADE;
        DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
      `;
      
      await this.executeSQL(dropTables);
      console.log('Full reset completed');
    } catch (error) {
      console.error('Full reset failed:', error);
      throw error;
    }
  }
}

// CLI 실행을 위한 함수
export async function runMigration(): Promise<void> {
  const migrationService = new SupabaseMigrationService();
  
  try {
    await migrationService.createTables();
    await migrationService.migrateExistingData();
    
    const isValid = await migrationService.verifyMigration();
    if (isValid) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('❌ Migration verification failed');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// 직접 실행 시
if (require.main === module) {
  runMigration();
}