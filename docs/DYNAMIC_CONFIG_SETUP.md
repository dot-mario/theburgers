# 동적 설정 시스템 설정 가이드

이 가이드는 하드코딩된 감지 패턴을 Supabase 기반 동적 설정 시스템으로 전환하는 방법을 설명합니다.

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 API 키 확인

### 1.2 환경변수 설정
`.env` 파일을 생성하고 다음 내용을 추가:

```bash
# 기존 Discord/CHZZK 설정
DISCORD_TOKEN=your-discord-bot-token
DISCORD_ALERT_CHANNEL_ID=your-alert-channel-id
DISCORD_BAN_CHANNEL_ID=your-ban-channel-id
NID_AUTH=your-nid-auth-cookie
NID_SESSION=your-nid-session-cookie

# Supabase 설정 (새로 추가)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 웹 서버 설정 (새로 추가)
WEB_PORT=3000
ENABLE_WEB_SERVER=true
ALLOWED_ORIGINS=http://localhost:3000
```

## 2. 데이터베이스 스키마 설정

### 2.1 Supabase SQL 에디터에서 실행

Supabase 대시보드의 SQL 에디터에서 다음 SQL을 실행하세요:

```sql
-- UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- detection_groups 테이블 생성
CREATE TABLE detection_groups (
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

-- system_settings 테이블 생성
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_name TEXT NOT NULL UNIQUE,
  value_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- configuration_history 테이블 생성
CREATE TABLE configuration_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES detection_groups(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_detection_groups_updated_at
  BEFORE UPDATE ON detection_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS 정책 설정
ALTER TABLE detection_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_history ENABLE ROW LEVEL SECURITY;

-- 읽기 접근 허용
CREATE POLICY "Enable read access for all users" ON detection_groups
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON system_settings
  FOR SELECT USING (true);

-- 서비스 롤 모든 접근 허용
CREATE POLICY "Enable all operations for service role" ON detection_groups
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON system_settings
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations for service role" ON configuration_history
  FOR ALL USING (auth.role() = 'service_role');
```

### 2.2 기본 데이터 삽입

```sql
-- 기본 감지 그룹 생성
INSERT INTO detection_groups (name, display_name, characters, color, emoji, enabled, threshold) VALUES
('burger', '버거', '["젖", "버", "거"]', 13874041, '🍔', true, 5),
('chicken', '치킨', '["젖", "치", "킨"]', 16761856, '🍗', true, 5),
('pizza', '피자', '["젖", "피", "자"]', 16711680, '🍕', true, 5);

-- 기본 시스템 설정
INSERT INTO system_settings (key_name, value_data) VALUES
('countThreshold', '5'),
('alertCooldown', '300000'),
('countResetInterval', '60000');
```

## 3. 애플리케이션 빌드 및 실행

### 3.1 의존성 설치 및 빌드
```bash
npm install
npm run build
```

### 3.2 마이그레이션 실행 (선택사항)
기존 데이터를 자동으로 마이그레이션하려면:

```bash
npx ts-node src/migration/supabaseMigration.ts
```

### 3.3 애플리케이션 실행
```bash
npm start
```

## 4. 웹 인터페이스 사용법

애플리케이션 실행 후 `http://localhost:3000`으로 접속하여 웹 대시보드를 사용할 수 있습니다.

### 4.1 대시보드 기능

#### 감지 그룹 관리
- **그룹 추가**: 새로운 감지 패턴 그룹 생성
- **그룹 편집**: 기존 그룹의 문자, 색상, 임계값 등 수정
- **그룹 활성화/비활성화**: 그룹을 일시적으로 비활성화
- **그룹 삭제**: 불필요한 그룹 제거

#### 시스템 설정
- **카운트 임계값**: 알림을 트리거할 최소 카운트 수
- **알림 쿨다운**: 같은 그룹의 연속 알림 간 최소 간격
- **카운트 리셋 간격**: 자동으로 카운트를 리셋하는 간격

#### 실시간 모니터
- 현재 카운트 상태 실시간 확인
- 시스템 상태 및 가동 시간 모니터링

#### 통계
- 그룹별 설정 현황
- 시스템 사용 통계

### 4.2 그룹 설정 예시

새로운 "라면" 그룹을 추가하는 경우:

1. **그룹 추가** 버튼 클릭
2. 다음 정보 입력:
   - **그룹 이름**: `ramen`
   - **표시 이름**: `라면`
   - **이모지**: `🍜`
   - **색상**: 원하는 색상 선택
   - **문자 시퀀스**: `젖`, `라`, `면` 추가
   - **임계값**: `5`
   - **활성화**: 체크
3. **저장** 버튼 클릭

## 5. API 엔드포인트

프로그래밍 방식으로 설정을 관리하려면 다음 API를 사용할 수 있습니다:

### 그룹 관리
- `GET /api/config/groups` - 그룹 목록 조회
- `POST /api/config/groups` - 새 그룹 생성
- `PUT /api/config/groups/:id` - 그룹 수정
- `DELETE /api/config/groups/:id` - 그룹 삭제

### 시스템 설정
- `GET /api/config/settings` - 설정 조회
- `PUT /api/config/settings/:key` - 설정 업데이트

### 시스템 제어
- `POST /api/config/reload` - 설정 새로고침
- `GET /api/config/status` - 시스템 상태 조회

## 6. 실시간 업데이트

시스템은 Supabase Realtime을 통해 설정 변경사항을 자동으로 감지하고 적용합니다:

- 웹 인터페이스에서 설정 변경 시 즉시 반영
- 다중 인스턴스 환경에서도 실시간 동기화
- 서버 재시작 없이 새로운 감지 패턴 적용

## 7. 문제 해결

### 7.1 연결 문제
- Supabase URL과 API 키가 올바른지 확인
- 방화벽에서 Supabase로의 연결 허용
- 환경변수가 올바르게 설정되었는지 확인

### 7.2 권한 문제
- RLS 정책이 올바르게 설정되었는지 확인
- 서비스 롤 키가 올바른지 확인

### 7.3 데이터 문제
- SQL 스키마가 올바르게 생성되었는지 확인
- 기본 데이터가 삽입되었는지 확인

## 8. 보안 고려사항

- 프로덕션 환경에서는 ALLOWED_ORIGINS 제한
- Supabase 서비스 롤 키 보안 유지
- HTTPS 사용 권장
- 정기적인 백업 및 모니터링

## 9. 백업 및 복구

### 백업
```bash
# Supabase CLI를 사용한 백업
supabase db dump --file backup.sql

# 또는 pg_dump 사용
pg_dump "postgresql://..." > backup.sql
```

### 복구
```bash
# 백업에서 복구
psql "postgresql://..." < backup.sql
```

이제 하드코딩된 감지 패턴 대신 웹 인터페이스를 통해 동적으로 감지 그룹을 관리할 수 있습니다!