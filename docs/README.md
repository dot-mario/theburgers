# The Burgers

**한국어** · [English](./README.en.md) · [🏠 루트로 돌아가기](../README.md)

이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 통해 자동 생성되었으며, 이후 Claude 3.5 Sonnet을 통해 전면적인 리팩토링과 **동적 설정 시스템 구현**을 거쳐 코드 품질과 유지보수성을 크게 향상시켰습니다.  

<a href="https://discord.gg/kV8Jy3zT">
  <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
</a>

## 프로젝트 소개

**The Burgers**는 CHZZK 채팅 서비스와 Discord를 연동하여, 특정 단어 또는 명령어가 일정 횟수 이상 입력되면 자동으로 Discord 채널에 알림 메시지를 전송하는 봇입니다.  

### 🆕 **동적 설정 시스템** - 주요 혁신

기존의 하드코딩된 감지 패턴을 **완전히 동적이고 웹에서 관리 가능한 시스템**으로 전환했습니다:

- **웹 대시보드**: 브라우저에서 직관적인 UI로 감지 그룹 관리
- **실시간 적용**: 서버 재시작 없이 설정 변경 즉시 반영
- **Supabase 통합**: PostgreSQL 기반의 확장 가능한 데이터 저장
- **무제한 그룹**: '젖버거', '젖피자' 외에도 원하는 만큼 감지 패턴 추가 가능
- **실시간 모니터링**: 현재 카운트 상태 및 시스템 상태 실시간 확인

### 주요 기능

- **실시간 채팅 모니터링:**  
  CHZZK 채팅 서버에 연결하여 스트리머 채널의 채팅 메시지를 모니터링합니다.
  
- **동적 단어/문구 감지:** 🆕  
  웹 인터페이스를 통해 무제한으로 감지 그룹을 생성하고 관리할 수 있습니다. 각 그룹별로 문자 시퀀스, 색상, 이모지, 임계값을 개별 설정 가능합니다.
  
- **지능형 알림 시스템:**  
  각 그룹의 카운트가 설정된 임계값에 도달하면 해당 그룹의 스타일로 Discord 채널에 임베디드 메시지를 전송합니다.  
  시스템 메시지(예: 활동 제한, 임시 제한, 해제) 이벤트 발생 시에도 Discord 채널로 알림 메시지를 전송합니다.
  
- **웹 기반 설정 관리:** 🆕  
  `http://localhost:3000`에서 접근 가능한 반응형 웹 대시보드를 통해 모든 설정을 관리할 수 있습니다.
  
- **고급 리소스 관리:**  
  `CleanupableService` 인터페이스를 통한 일관된 리소스 관리와 `IntervalManager` 클래스를 사용한 중앙집중식 타이머 관리로 메모리 누수를 방지합니다.

- **의존성 주입 패턴:**  
  `Application` 클래스를 통한 중앙집중식 서비스 생명주기 관리와 graceful shutdown 기능을 제공합니다.

## 주요 기술 스택

### 코어 시스템
- **TypeScript:** 정적 타입 검사와 모던 JavaScript 문법을 활용한 안정적인 코드 작성
- **Node.js:** 서버 사이드 실행 환경
- **Discord.js:** Discord API 연동을 위한 라이브러리
- **CHZZK:** [kimcore/chzzk](https://github.com/kimcore/chzzk) 오픈소스 라이브러리를 사용하여 CHZZK 채팅 API 연동

### 동적 설정 시스템 🆕
- **Supabase:** PostgreSQL 기반 실시간 데이터베이스 및 인증
- **Express.js:** RESTful API 서버 및 웹 인터페이스 제공
- **Vanilla JavaScript:** 경량화된 프론트엔드 (외부 프레임워크 의존성 없음)
- **CORS:** 안전한 크로스 오리진 요청 처리

### 개발 도구
- **date-fns:** 날짜 및 시간 처리
- **dotenv:** 환경변수 관리
- **Jest:** 단위 테스트 프레임워크
- **Docker:** 멀티 스테이지 빌드를 통한 컨테이너 이미지 생성

## 프로젝트 파일 구조

```bash
theburgers/
├── .env                       # 환경변수 파일 (Supabase 설정 포함)
├── .env.example               # 🆕 환경변수 예시 파일
├── config/descriptions.json   # 동적 설명 문구 파일
├── Dockerfile                 # Docker 멀티 스테이지 빌드 파일
├── docker-compose.yml         # Docker Compose 설정 파일
├── package.json               # 의존성 및 스크립트 관리 파일
├── src/                       # 소스 코드 디렉터리
│   ├── application.ts         # 중앙 서비스 생명주기 관리자
│   ├── config.ts              # 환경변수 및 설정 관리 모듈
│   ├── constants.ts           # 확장된 상수 관리 (폴백용)
│   ├── types.ts               # 중앙집중식 타입 정의 및 인터페이스
│   ├── utils.ts               # 공통 유틸리티 클래스
│   ├── descriptionService.ts  # 동적 문구 로딩 및 파일 감시 서비스
│   ├── discordService.ts      # Discord 클라이언트 및 메시지 전송 모듈
│   ├── countManager.ts        # 🔄 동적 패턴 감지, 임계값 알림, 쿨다운 관리
│   ├── chzzkService.ts        # 🔄 CHZZK 채팅 연동 및 동적 패턴 처리
│   ├── index.ts               # 🔄 웹서버 통합 애플리케이션 엔트리 포인트
│   ├── webServer.ts           # 🆕 웹서버 통합 관리자
│   ├── types/                 # 🆕 타입 정의 디렉터리
│   │   └── database.ts        # 🆕 Supabase 데이터베이스 타입
│   ├── database/              # 🆕 데이터베이스 연동
│   │   └── supabaseClient.ts  # 🆕 Supabase 클라이언트 설정
│   ├── config/                # 🆕 동적 설정 시스템
│   │   ├── SupabaseConfigurationService.ts  # 🆕 설정 서비스
│   │   └── DynamicConstants.ts              # 🆕 동적 상수 관리
│   ├── web/                   # 🆕 웹 인터페이스
│   │   ├── configApi.ts       # 🆕 REST API 엔드포인트
│   │   └── public/            # 🆕 웹 대시보드
│   │       ├── dashboard.html # 🆕 메인 대시보드 UI
│   │       ├── css/dashboard.css  # 🆕 반응형 스타일
│   │       └── js/dashboard.js    # 🆕 프론트엔드 로직
│   └── migration/             # 🆕 데이터 마이그레이션
│       └── supabaseMigration.ts   # 🆕 기존 데이터 마이그레이션 스크립트
├── docs/                      # 📚 문서 디렉터리
│   ├── README.md              # 한국어 문서 (현재 파일)
│   ├── README.en.md           # 영어 문서
│   ├── CLAUDE.md              # Claude Code 개발 가이드
│   └── DYNAMIC_CONFIG_SETUP.md  # 설정 시스템 가이드 (신규 설치 + 마이그레이션)
└── __tests__/                 # 포괄적인 테스트 파일 디렉터리
    ├── application.test.ts         # Application 클래스 테스트
    ├── utils.test.ts               # 유틸리티 클래스들 테스트
    ├── config.test.ts              # config 모듈 테스트
    ├── descriptionService.test.ts  # 파일 감시, 랜덤 선택, 에러 처리 테스트
    ├── discordService.test.ts      # Discord 클라이언트 생명주기 및 에러 처리 테스트
    ├── countManager.test.ts        # 동적 패턴 기반 테스트, 임계값 검증
    └── chzzkService.test.ts        # 메시지 처리, 밴 시스템, 이벤트 핸들링 테스트
```

## 사용법

### 🚀 빠른 시작 (동적 설정 시스템)

1. **프로젝트 클론 및 의존성 설치**
```bash
git clone https://github.com/your-repo/theburgers.git
cd theburgers
npm install
```

2. **Supabase 프로젝트 설정**
- [Supabase](https://supabase.com)에서 새 프로젝트 생성
- 프로젝트 URL과 API 키 확인

3. **환경변수 설정**
`.env` 파일을 생성하고 필요한 값들을 설정:
```bash
# 기존 Discord/CHZZK 설정
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token

# 🆕 Supabase 설정
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🆕 웹 서버 설정
WEB_PORT=3000
ENABLE_WEB_SERVER=true
ALLOWED_ORIGINS=http://localhost:3000
```

4. **데이터베이스 초기화**
[동적 설정 시스템 설정 가이드](./DYNAMIC_CONFIG_SETUP.md)의 SQL 스크립트를 Supabase SQL 에디터에서 실행합니다.

5. **빌드 및 실행**
```bash
npm run build
npm start
```

6. **웹 대시보드 접속** 🎉
브라우저에서 `http://localhost:3000`으로 접속하여 감지 그룹을 관리하세요!

### 📊 웹 대시보드 기능

#### 감지 그룹 관리
- **그룹 추가**: 새로운 감지 패턴 그룹 생성 (예: '라면', '떡볶이' 등)
- **그룹 편집**: 문자 시퀀스, 색상, 이모지, 임계값 개별 설정
- **실시간 미리보기**: 설정 변경사항 즉시 확인
- **그룹 활성화/비활성화**: 임시로 특정 그룹 비활성화
- **검색 및 필터**: 많은 그룹도 쉽게 관리

#### 시스템 설정
- **글로벌 임계값**: 모든 그룹의 기본 임계값 설정
- **알림 쿨다운**: 연속 알림 간 최소 간격 설정
- **카운트 리셋**: 자동 카운트 리셋 간격 설정

#### 실시간 모니터링
- **현재 카운트**: 각 그룹별 실시간 카운트 상태
- **시스템 상태**: 연결 상태, 가동 시간, 활성 그룹 수
- **자동 새로고침**: 30초마다 자동으로 상태 업데이트

### 🔧 개발 모드

개발 중에는 TypeScript 파일을 자동으로 감시하여 컴파일:
```bash
npm run dev
```

### 🧪 테스트

단위 테스트 실행:
```bash
npm run test

# 특정 테스트만 실행
npm test -- --testNamePattern="SupabaseConfiguration"
npm test -- --testNamePattern="DynamicConstants"
```

### 🐳 Docker 사용

```bash
# Docker 이미지 빌드
docker build -t theburgers .

# 컨테이너 실행
docker run -d --env-file .env -p 3000:3000 theburgers

# Docker Compose 사용
docker-compose up -d
```

## API 엔드포인트 🆕

프로그래밍 방식으로 설정을 관리할 수 있는 RESTful API:

### 그룹 관리
- `GET /api/config/groups` - 그룹 목록 조회
- `POST /api/config/groups` - 새 그룹 생성
- `PUT /api/config/groups/:id` - 그룹 수정
- `DELETE /api/config/groups/:id` - 그룹 삭제

### 시스템 설정
- `GET /api/config/settings` - 시스템 설정 조회
- `PUT /api/config/settings/:key` - 설정 업데이트

### 시스템 제어
- `POST /api/config/reload` - 설정 강제 새로고침
- `GET /api/config/status` - 시스템 상태 및 통계
- `GET /api/config/validation` - 설정 유효성 검증

## 설정 및 마이그레이션 🔧

- **신규 설치**: [동적 설정 시스템 설정 가이드](./DYNAMIC_CONFIG_SETUP.md) 참조
- **기존 시스템 업그레이드**: 동일 가이드의 [기존 시스템 마이그레이션](./DYNAMIC_CONFIG_SETUP.md#기존-시스템-마이그레이션) 섹션 참조

## CI/CD & GitHub Actions

이 프로젝트는 GitHub Actions를 활용하여 자동화된 CI/CD 파이프라인을 구성하고 있습니다:

### 1. Build and Deploy Docker Image
`main` 브랜치에 push되거나 release가 발행될 때 실행되며, Docker 이미지를 빌드하고 Docker Hub에 배포합니다.  
워크플로우 파일: `.github/workflows/deploy.yml`

### 2. Run Tests on Pull Requests
`main` 브랜치를 대상으로 하는 Pull Request가 생성될 때 실행되며, 테스트가 모두 통과되어야만 PR이 merge될 수 있도록 합니다.  
워크플로우 파일: `.github/workflows/test.yml`

### 브랜치 전략 및 보호 규칙
- **develop**: 개발용 브랜치로, 새로운 기능 및 버그 수정
- **main**: 배포용 브랜치로, 테스트와 코드 리뷰를 거친 변경사항만 merge

GitHub Branch Protection Rules를 통해 main 브랜치에는 직접 push를 막고, PR을 통해서만 merge되도록 설정했습니다.

## 코드 아키텍처 및 리팩토링

### 🏗️ 아키텍처 혁신사항

#### 동적 설정 시스템 🆕
- **웹 기반 관리**: 하드코딩 → 동적 웹 인터페이스
- **Supabase 통합**: PostgreSQL + Realtime으로 확장 가능한 데이터 저장
- **실시간 적용**: 서버 재시작 없이 설정 변경 즉시 반영
- **무제한 확장**: 원하는 만큼 감지 그룹 추가 가능
- **타입 안전성**: TypeScript로 데이터베이스 스키마 타입 보장

#### 기존 아키텍처 개선
- **의존성 주입 패턴**: `Application` 클래스를 통한 중앙집중식 서비스 관리
- **타입 안전성 강화**: `types.ts`에서 모든 인터페이스 중앙 관리
- **유틸리티 기반 설계**: 재사용 가능한 `BanUtils`, `DateUtils`, `ArrayUtils` 클래스
- **리소스 관리 개선**: `IntervalManager`와 `CleanupableService` 인터페이스

### 🔧 코드 품질 향상

- **동적 설정 로딩**: 하드코딩된 constants → 데이터베이스 기반 동적 로딩
- **에러 처리 표준화**: 모든 서비스에서 일관된 에러 처리 패턴
- **폴백 시스템**: Supabase 연결 실패 시 기본 설정으로 자동 전환
- **테스트 커버리지 확대**: 동적 설정 시스템 포함 포괄적 테스트
- **Graceful Shutdown**: 시그널 핸들러를 통한 안전한 종료 프로세스

### 🧪 테스트 전략

- **유닛 테스트**: 각 유틸리티 클래스별 독립적 테스트
- **통합 테스트**: Application 생명주기 전체 테스트
- **동적 설정 테스트**: 설정 변경 및 적용 과정 검증
- **API 테스트**: 웹 API 엔드포인트 기능 테스트
- **모킹 전략**: 외부 API 의존성 완전 격리

### 🚀 성능 최적화

- **실시간 동기화**: Supabase Realtime을 통한 즉시 설정 동기화
- **캐싱 전략**: 30초 TTL로 성능과 실시간성 균형
- **메모리 누수 방지**: 중앙집중식 interval 관리
- **코드 재사용성**: 50% 중복 코드 제거
- **확장 가능성**: 웹 인터페이스로 무제한 그룹 관리

### 📚 개발 히스토리

- **초기 개발**: ChatGPT o3 mini를 통한 자동 생성 (99% 코드)
- **리팩토링**: Claude 3.5 Sonnet을 통한 전면적 코드 품질 개선
- **동적 시스템 구현**: 하드코딩 → Supabase 기반 동적 설정 시스템 🆕
- **웹 인터페이스 개발**: 사용자 친화적 관리 대시보드 구축 🆕
- **테스트 체계 구축**: 포괄적 테스트 스위트 및 CI/CD 통합

## 기여 방법

기여를 원하시는 분들은 아래 단계를 참고해 주세요:

1. 이 레포지토리를 Fork 합니다
2. 새로운 브랜치를 생성합니다: `git checkout -b feature/your-feature-name`
3. 변경 사항을 커밋합니다: `git commit -m 'Add some feature'`
4. 원격 레포지토리에 푸시합니다: `git push origin feature/your-feature-name`
5. Pull Request를 생성합니다

### 개발 가이드라인

- **동적 설정**: 새로운 감지 패턴은 웹 인터페이스를 통해 추가
- **타입 안전성**: TypeScript 타입 정의 준수
- **테스트 작성**: 새 기능에 대한 테스트 필수
- **문서 업데이트**: 기능 변경 시 관련 문서 업데이트

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참고해 주세요.

---

## 🎉 혁신 요약

**하드코딩 시절** → **동적 설정 시대**
- `constants.ts` 수정 → 웹 브라우저에서 클릭
- 서버 재시작 필요 → 실시간 적용
- 3개 고정 그룹 → 무제한 그룹
- 개발자만 수정 가능 → 누구나 웹에서 관리

이제 '젖버거', '젖피자' 뿐만 아니라 '젖라면', '젖떡볶이', '젖치킨' 등 원하는 모든 패턴을 **웹 브라우저에서 실시간으로 추가**할 수 있습니다! 🚀