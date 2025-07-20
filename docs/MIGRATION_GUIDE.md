# 마이그레이션 가이드 - 하드코딩에서 동적 설정으로

**Migration Guide - From Hardcoded to Dynamic Configuration**

이 가이드는 기존 하드코딩된 감지 패턴 시스템을 새로운 동적 설정 시스템으로 업그레이드하는 방법을 안내합니다.

## 🔄 업그레이드 개요

### 변경사항 요약

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

## 📋 사전 준비

### 1. 기존 데이터 백업

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

### 2. 버전 호환성 확인

현재 프로젝트가 동적 설정 시스템과 호환되는지 확인:

```bash
# package.json에서 필수 의존성 확인
grep -E "(typescript|express|cors)" package.json

# 필요한 파일 구조 확인
ls -la src/types/ src/database/ src/config/ src/web/ 2>/dev/null || echo "⚠️ 동적 설정 파일들이 없습니다"
```

## 🛠️ 단계별 마이그레이션

### 단계 1: Supabase 프로젝트 설정

1. **Supabase 계정 생성 및 프로젝트 생성**
   - [Supabase](https://supabase.com)에서 무료 계정 생성
   - 새 프로젝트 생성
   - 프로젝트 URL과 API 키 기록

2. **데이터베이스 스키마 생성**
   
   Supabase SQL 에디터에서 다음 스크립트 실행:

```sql
-- 1. 감지 그룹 테이블 생성
CREATE TABLE detection_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    characters JSONB NOT NULL,
    color INTEGER NOT NULL,
    emoji TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    threshold INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 시스템 설정 테이블 생성
CREATE TABLE system_settings (
    key_name TEXT PRIMARY KEY,
    value_data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 설정 변경 이력 테이블 생성
CREATE TABLE configuration_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES detection_groups(id),
    change_type TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Row Level Security (RLS) 설정
ALTER TABLE detection_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuration_history ENABLE ROW LEVEL SECURITY;

-- 5. 기본 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Allow all operations on detection_groups" ON detection_groups FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_settings" ON system_settings FOR ALL USING (true);
CREATE POLICY "Allow all operations on configuration_history" ON configuration_history FOR ALL USING (true);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_detection_groups_name ON detection_groups(name);
CREATE INDEX idx_detection_groups_enabled ON detection_groups(enabled);
CREATE INDEX idx_system_settings_key ON system_settings(key_name);
```

3. **기본 데이터 삽입**

```sql
-- 기존 하드코딩된 그룹들을 데이터베이스에 삽입
INSERT INTO detection_groups (name, display_name, characters, color, emoji, threshold) VALUES
('burger', '젖버거', '["젖", "버", "거"]', 16776960, '🍔', 3),
('pizza', '젖피자', '["젖", "피", "자"]', 16711680, '🍕', 3),
('chicken', '젖치킨', '["젖", "치", "킨"]', 65280, '🍗', 3);

-- 기본 시스템 설정
INSERT INTO system_settings (key_name, value_data) VALUES
('global_threshold', '3'),
('alert_cooldown', '300'),
('count_reset_interval', '3600');
```

### 단계 2: 환경변수 설정

기존 `.env` 파일에 Supabase 설정 추가:

```bash
# 기존 Discord/CHZZK 설정 (유지)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token

# 🆕 Supabase 설정 (새로 추가)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🆕 웹 서버 설정 (새로 추가)
WEB_PORT=3000
ENABLE_WEB_SERVER=true
ALLOWED_ORIGINS=http://localhost:3000
```

### 단계 3: 의존성 설치 및 빌드

```bash
# 새로운 의존성 설치
npm install

# TypeScript 컴파일 확인
npm run build

# 빌드 성공 확인
echo "✅ 빌드 성공!" || echo "❌ 빌드 실패 - 환경변수 확인 필요"
```

### 단계 4: 데이터 마이그레이션 실행

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

### 단계 5: 설정 검증

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

### 단계 6: 정리 및 최적화

마이그레이션 완료 후 정리 작업:

```bash
# 기존 하드코딩 상수 파일 백업으로 이동 (선택사항)
mv src/constants.ts backup_*/constants.ts.backup

# 빌드 재실행으로 정리
npm run build

# 테스트 실행으로 모든 기능 검증
npm run test
```

## 🔧 문제 해결

### 일반적인 문제들

#### 1. Supabase 연결 실패
```bash
# 연결 테스트
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://your-project.supabase.co/rest/v1/detection_groups"
```

**해결책**:
- `.env` 파일의 SUPABASE_URL과 키 값 확인
- Supabase 프로젝트가 일시 중지되지 않았는지 확인
- 방화벽/네트워크 설정 확인

#### 2. 웹 서버가 시작되지 않음
```bash
# 포트 사용 중인지 확인
netstat -an | grep :3000
```

**해결책**:
- `WEB_PORT` 환경변수를 다른 포트로 변경
- `ENABLE_WEB_SERVER=true` 설정 확인

#### 3. 마이그레이션 스크립트 실패
**일반적인 원인**:
- 데이터베이스 스키마가 생성되지 않음
- 환경변수 설정 오류
- 네트워크 연결 문제

**해결책**:
```bash
# 환경변수 확인
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# 수동 마이그레이션
npx ts-node -e "
import { supabaseAdmin } from './src/database/supabaseClient';
supabaseAdmin.from('detection_groups').select('*').then(console.log);
"
```

#### 4. 기존 기능이 작동하지 않음
**폴백 시스템 활용**:
- 동적 설정 시스템은 Supabase 연결 실패 시 자동으로 기존 하드코딩된 상수를 사용
- `src/constants.ts` 파일이 백업으로 유지되어야 함

## 📊 마이그레이션 검증 체크리스트

### ✅ 필수 확인 항목

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

### 🔄 선택 확인 항목

- [ ] 백업 파일 정리
- [ ] 추가 보안 설정 (RLS 정책 세부 조정)
- [ ] 성능 모니터링 설정
- [ ] 로그 확인 및 최적화

## 🎯 업그레이드 후 활용법

### 새로운 기능 활용

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

## 🔙 롤백 방법

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

## 📞 지원 및 도움

문제가 발생하거나 추가 도움이 필요한 경우:

1. **로그 확인**: 애플리케이션 로그에서 오류 메시지 확인
2. **GitHub Issues**: 프로젝트 GitHub 페이지에서 이슈 보고
3. **Discord**: 프로젝트 Discord 서버에서 실시간 지원

---

**🎉 축하합니다!** 이제 웹 브라우저에서 실시간으로 감지 패턴을 관리할 수 있습니다!