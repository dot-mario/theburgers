# 동적 설정 시스템 설정 가이드

이 가이드는 하드코딩된 감지 패턴을 Supabase 기반 동적 설정 시스템으로 전환하는 방법을 설명합니다.

## 📋 목차
- [신규 설치](#신규-설치)
- [기존 시스템 마이그레이션](#기존-시스템-마이그레이션)
- [웹 인터페이스 사용법](#웹-인터페이스-사용법)
- [API 엔드포인트](#api-엔드포인트)
- [문제 해결](#문제-해결)

---

## 신규 설치

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

---

## 기존 시스템 마이그레이션

기존 하드코딩된 시스템에서 동적 설정 시스템으로 업그레이드하는 방법입니다.

### 🔄 업그레이드 개요

**Before (하드코딩 시스템)**:
- `src/constants.ts`에서 '젖버거', '젖피자' 패턴 하드코딩
- 새 패턴 추가 시 코드 수정 → 서버 재시작 필요
- 개발자만 패턴 관리 가능
- 제한된 그룹 (3개 고정)

**After (동적 설정 시스템)**:
- Supabase 데이터베이스에서 패턴 관리
- 웹 대시보드(`http://localhost:3000`)에서 실시간 관리
- 서버 재시작 없이 즉시 적용
- 무제한 그룹 추가 가능
- 누구나 웹에서 쉽게 관리

### 📋 사전 준비

#### 1. 기존 데이터 백업

업그레이드 전 중요한 설정 파일들을 백업하세요:

```bash
# 현재 디렉터리에 백업 폴더 생성
mkdir backup_$(date +%Y%m%d_%H%M%S)

# 중요 파일 백업
cp .env backup_*/
cp config/descriptions.json backup_*/
cp src/constants.ts backup_*/

echo "✅ 백업 완료!"
```

#### 2. 버전 호환성 확인

현재 프로젝트가 동적 설정 시스템과 호환되는지 확인:

```bash
# package.json에서 필수 의존성 확인
grep -E "(typescript|express|cors)" package.json

# 필요한 파일 구조 확인
ls -la src/types/ src/database/ src/config/ src/web/ 2>/dev/null || echo "⚠️ 동적 설정 파일들이 없습니다"
```

### 🛠️ 단계별 마이그레이션

#### 단계 1: 기존 신규 설치 과정 완료
위의 [신규 설치](#신규-설치) 섹션의 1-3단계를 완료하세요.

#### 단계 2: 데이터 마이그레이션 실행

자동 마이그레이션 스크립트 실행:

```bash
# 기존 하드코딩된 데이터를 Supabase로 마이그레이션
npx ts-node src/migration/supabaseMigration.ts
```

예상 출력:
```
🚀 Starting Supabase migration...
✅ Supabase connection successful
📊 Found 3 hardcoded groups to migrate
✅ Migrated group: burger (젖버거)
✅ Migrated group: pizza (젖피자)  
✅ Migrated group: chicken (젖치킨)
📋 Migration completed successfully!
```

#### 단계 3: 설정 검증

1. **애플리케이션 시작**
```bash
npm start
```

2. **웹 대시보드 접속**
   - 브라우저에서 `http://localhost:3000` 접속
   - 마이그레이션된 그룹들이 표시되는지 확인

3. **기능 테스트**
   - 웹에서 새 그룹 추가해보기
   - 기존 그룹 수정해보기
   - 실시간 적용 확인

#### 단계 4: 정리 및 최적화

마이그레이션 완료 후 정리 작업:

```bash
# 기존 하드코딩 상수 파일 백업으로 이동 (선택사항)
mv src/constants.ts backup_*/constants.ts.backup

# 빌드 재실행으로 정리
npm run build

# 테스트 실행으로 모든 기능 검증
npm run test
```

### 📊 마이그레이션 검증 체크리스트

#### ✅ 필수 확인 항목

- [ ] Supabase 프로젝트 생성 및 데이터베이스 스키마 설정
- [ ] 환경변수 파일(.env) 업데이트 완료
- [ ] `npm install` 및 `npm run build` 성공
- [ ] 마이그레이션 스크립트 실행 성공
- [ ] 웹 대시보드(`http://localhost:3000`) 접속 가능
- [ ] 기존 그룹들(젖버거, 젖피자, 젖치킨) 표시 확인
- [ ] 새 그룹 추가 기능 테스트
- [ ] 그룹 수정 기능 테스트
- [ ] 그룹 삭제 기능 테스트
- [ ] CHZZK 채팅 모니터링 정상 작동
- [ ] Discord 알림 정상 전송

#### 🔄 선택 확인 항목

- [ ] 백업 파일 정리
- [ ] 추가 보안 설정 (RLS 정책 세부 조정)
- [ ] 성능 모니터링 설정
- [ ] 로그 확인 및 최적화

### 🎯 업그레이드 후 활용법

#### 새로운 기능 활용

1. **무제한 그룹 추가**
   ```
   웹 대시보드 → Groups 탭 → Add New Group
   예: '젖라면', '젖떡볶이', '젖치킨', '젖삼겹살' 등
   ```

2. **실시간 설정 변경**
   ```
   임계값 조정, 색상 변경, 이모지 변경 등이 즉시 반영
   ```

3. **시스템 모니터링**
   ```
   Monitor 탭에서 실시간 카운트 및 시스템 상태 확인
   ```

4. **API 활용**
   ```bash
   # 그룹 목록 조회
   curl http://localhost:3000/api/config/groups
   
   # 새 그룹 추가
   curl -X POST http://localhost:3000/api/config/groups \
        -H "Content-Type: application/json" \
        -d '{"name":"ramen","display_name":"젖라면","characters":["젖","라","면"],"color":16776960,"emoji":"🍜","threshold":3}'
   ```

### 🔙 롤백 방법

만약 문제가 발생하여 이전 시스템으로 돌아가야 하는 경우:

```bash
# 1. 현재 프로세스 중단
pkill -f "node.*theburgers"

# 2. 백업에서 파일 복원
cp backup_*/constants.ts src/
cp backup_*/.env ./

# 3. 환경변수에서 Supabase 설정 제거 또는 주석 처리
sed -i 's/^SUPABASE/#SUPABASE/g' .env
sed -i 's/^WEB_PORT/#WEB_PORT/g' .env
sed -i 's/^ENABLE_WEB_SERVER/#ENABLE_WEB_SERVER/g' .env

# 4. 이전 버전 빌드 및 실행
npm run build
npm start
```

이제 하드코딩된 감지 패턴 대신 웹 인터페이스를 통해 동적으로 감지 그룹을 관리할 수 있습니다!