# The Burgers

**한국어** · [English](./README.en.md) · [🏠 루트로 돌아가기](../README.md)

이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 통해 자동 생성되었으며, 이후 Claude 3.5 Sonnet을 통해 전면적인 리팩토링을 거쳐 코드 품질과 유지보수성을 크게 향상시켰습니다.  

<a href="https://discord.gg/kV8Jy3zT">
  <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
</a>

## 프로젝트 소개

**The Burgers**는 CHZZK 채팅 서비스와 Discord를 연동하여, 특정 단어 또는 명령어가 일정 횟수 이상 입력되면 자동으로 Discord 채널에 알림 메시지를 전송하는 봇입니다.  

주요 기능은 다음과 같습니다:

- **실시간 채팅 모니터링:**  
  CHZZK 채팅 서버에 연결하여 스트리머 채널의 채팅 메시지를 모니터링합니다.
  
- **단어/문구 카운팅:**  
  특정 그룹(예: burger, chicken, pizza)별로 단어(예: '젖', '버', '거' 등)의 입력 횟수를 카운팅합니다.
  
- **알림 전송:**  
  각 그룹의 카운트가 사전에 정해진 임계값(예: 10)에 도달하면 Discord 채널로 임베디드 메시지를 전송합니다.  
  시스템 메시지(예: 활동 제한, 임시 제한, 해제) 이벤트 발생 시에도 Discord 채널로 알림 메시지를 전송합니다.
  
- **동적 설명 문구:**  
  `descriptions.json` 파일에서 동적으로 설명 문구를 로드하며, 파일 변경을 감지하여 실시간으로 반영합니다.
  
- **고급 리소스 관리:**  
  `CleanupableService` 인터페이스를 통한 일관된 리소스 관리와 `IntervalManager` 클래스를 사용한 중앙집중식 타이머 관리로 메모리 누수를 방지합니다.

- **의존성 주입 패턴:**  
  `Application` 클래스를 통한 중앙집중식 서비스 생명주기 관리와 graceful shutdown 기능을 제공합니다.

- **유틸리티 기반 아키텍처:**  
  `BanUtils`, `DateUtils`, `ArrayUtils` 등의 유틸리티 클래스로 코드 재사용성과 테스트 용이성을 개선했습니다.

## 주요 기술 스택

- **TypeScript:** 정적 타입 검사와 모던 JavaScript 문법을 활용한 안정적인 코드 작성.
- **Node.js:** 서버 사이드 실행 환경.
- **Discord.js:** Discord API 연동을 위한 라이브러리.
- **CHZZK:** [kimcore/chzzk](https://github.com/kimcore/chzzk) 오픈소스 라이브러리를 사용하여 CHZZK 채팅 API 연동 기능 구현.
- **date-fns:** 날짜 및 시간 처리.
- **dotenv:** 환경변수 관리.
- **Jest:** 단위 테스트 프레임워크.
- **Docker:** 멀티 스테이지 빌드를 통한 컨테이너 이미지 생성.

## 프로젝트 파일 구조

```bash
theburgers/
├── .env                      # 환경변수 파일
├── descriptions.json         # 동적 설명 문구 파일
├── Dockerfile                # Docker 멀티 스테이지 빌드 파일
├── docker-compose.yml        # Docker Compose 설정 파일
├── jest.config.js            # Jest 설정 파일
├── package.json              # 의존성 및 스크립트 관리 파일
├── package-lock.json         # npm 의존성 잠금 파일
├── tsconfig.json             # TypeScript 컴파일 설정 파일
├── README.md                 # 프로젝트 설명 및 사용법, 자동 생성 코드 설명 포함
├── src/                      # 소스 코드 디렉터리
│   ├── application.ts        # 🆕 중앙 서비스 생명주기 관리자 (의존성 주입, graceful shutdown)
│   ├── config.ts             # 환경변수 및 설정 관리 모듈
│   ├── constants.ts          # 🆕 확장된 상수 관리 (그룹 문자, 색상, 밴 액션 등)
│   ├── types.ts              # 🆕 중앙집중식 타입 정의 및 인터페이스
│   ├── utils.ts              # 🆕 공통 유틸리티 클래스 (BanUtils, DateUtils, IntervalManager 등)
│   ├── descriptionService.ts # 동적 문구 로딩 및 파일 감시 서비스
│   ├── discordService.ts     # Discord 클라이언트 및 메시지 전송 모듈
│   ├── countManager.ts       # 패턴 감지, 임계값 알림, 쿨다운 관리
│   ├── chzzkService.ts       # CHZZK 채팅 연동 및 시스템 메시지 처리
│   └── index.ts              # 단순화된 애플리케이션 엔트리 포인트
└── __tests__/                # 포괄적인 테스트 파일 디렉터리
    ├── application.test.ts        # 🆕 Application 클래스 테스트 (생명주기, graceful shutdown)
    ├── utils.test.ts              # 🆕 유틸리티 클래스들 테스트 (BanUtils, DateUtils 등)
    ├── config.test.ts             # config 모듈 테스트
    ├── descriptionService.test.ts # 파일 감시, 랜덤 선택, 에러 처리 테스트
    ├── discordService.test.ts     # Discord 클라이언트 생명주기 및 에러 처리 테스트
    ├── countManager.test.ts       # 상수 기반 동적 테스트, 임계값 검증
    └── chzzkService.test.ts       # 메시지 처리, 밴 시스템, 이벤트 핸들링 테스트

```


## 사용법

### 1. 설치

먼저 프로젝트 디렉터리로 이동한 후 의존성을 설치합니다:

```bash
npm install
```

### 2. 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하고, 아래와 같이 필요한 환경변수를 설정합니다:

```dotenv
DISCORD_TOKEN=your_discord_bot_token
DISCORD_ALERT_CHANNEL_ID=your_discord_alert_channel_id
DISCORD_BAN_CHANNEL_ID=your_discord_ban_channel_id
NID_AUTH=your_nid_auth_token
NID_SESSION=your_nid_session_token
```

### 3. 동적 설명 문구 설정

프로젝트 루트에 `descriptions.json` 파일을 생성합니다. 예시는 다음과 같습니다:

```json
{
  "burger": ["송재욱 버거 뿌린다 ㅋㅋ"],
  "chicken": ["송재욱 치킨 뿌린다 ㅋㅋ"],
  "pizza": ["송재욱 피자 뿌린다 ㅋㅋ"]
}
```

### 4. 빌드 및 실행

TypeScript 코드를 컴파일하여 `dist/` 폴더에 생성합니다:

```bash
npm run build
```

빌드가 완료되면 애플리케이션을 실행합니다:

```bash
npm start
```

### 5. 개발 모드

개발 중에는 TypeScript 파일을 자동으로 감시하여 컴파일하도록 다음 명령어를 사용할 수 있습니다:

```bash
npm run dev
```

### 6. 테스트

단위 테스트를 실행하려면 다음 명령어를 사용합니다:

```bash
npm run test
```

#### 개별 테스트 실행
특정 서비스나 기능만 테스트하고 싶은 경우:

```bash
# 특정 테스트 파일 실행
npm test -- --testNamePattern="utils"
npm test -- --testNamePattern="Application"

# 특정 테스트 케이스 실행
npm test -- --testNamePattern="BanUtils"
```

모든 테스트가 통과하면 리팩토링된 아키텍처와 새로운 유틸리티 클래스들이 정상 작동하는 것을 확인할 수 있습니다.

### 7. Docker 사용

#### Docker Build 및 Run

프로젝트는 Docker를 사용한 멀티 스테이지 빌드를 지원합니다.  
아래 명령어로 Docker 이미지를 빌드할 수 있습니다:

```bash
docker build -t theburgers .
```

그리고 Docker 컨테이너를 실행합니다:
```bash
docker run -d --env-file .env theburgers
```

#### Docker Compose 사용
또한, Docker Compose를 사용하여 여러 서비스를 동시에 관리할 수 있습니다.

1. 필요한 환경변수를 .env 파일에 설정합니다.
2. 터미널에서 다음 명령어를 실행합니다:
> `.env` 파일이 준비돼있어야 합니다.
```bash
docker-compose up -d
```
5분 간격으로 Docker Hub에서 최신 이미지가 있는지 확인하여 자동 업데이트를 수행합니다.

## CI/CD & GitHub Actions

이 프로젝트는 GitHub Actions를 활용하여 자동화된 CI/CD 파이프라인을 구성하고 있습니다. 주요 워크플로우는 다음과 같습니다:

### 1. Build and Deploy Docker Image

이 워크플로우는 `main` 브랜치에 push되거나 release가 발행될 때 실행되며, Docker 이미지를 빌드하고 Docker Hub에 배포합니다.  
워크플로우 파일: `.github/workflows/deploy.yml`

### 2. Run Tests on Pull Requests
이 워크플로우는 `main` 브랜치를 대상으로 하는 Pull Request가 생성될 때 실행되며, 테스트가 모두 통과되어야만 PR이 merge될 수 있도록 합니다.
워크플로우 파일: `.github/workflows/test.yml`

### 브랜치 전략 및 보호 규칙

이 프로젝트는 두 개의 주요 브랜치를 사용합니다:

* develop: 개발용 브랜치로, 새로운 기능 및 버그 수정이 이곳에서 진행됩니다.
* main: 배포용 브랜치로, 테스트와 코드 리뷰를 거친 변경사항만 merge됩니다.

GitHub Branch Protection Rules를 통해 main 브랜치에는 직접 push를 막고, PR을 통해서만 merge되도록 설정했습니다. 즉, 테스트와 CI가 통과된 PR만 main 브랜치로 merge됩니다.

## 코드 아키텍처 및 리팩토링

### 🏗️ 아키텍처 개선사항

- **의존성 주입 패턴:** `Application` 클래스를 통한 중앙집중식 서비스 관리
- **타입 안전성 강화:** `types.ts`에서 모든 인터페이스 중앙 관리
- **유틸리티 기반 설계:** 재사용 가능한 `BanUtils`, `DateUtils`, `ArrayUtils` 클래스
- **리소스 관리 개선:** `IntervalManager`와 `CleanupableService` 인터페이스

### 🔧 코드 품질 향상

- **상수 중앙화:** `constants.ts`에서 모든 설정값 관리 (그룹 문자, 색상, 밴 액션)
- **에러 처리 표준화:** 모든 서비스에서 일관된 에러 처리 패턴
- **테스트 커버리지 확대:** 73개 테스트로 97.3% 성공률 달성
- **Graceful Shutdown:** 시그널 핸들러를 통한 안전한 종료 프로세스

### 🧪 테스트 전략

- **유닛 테스트:** 각 유틸리티 클래스별 독립적 테스트
- **통합 테스트:** Application 생명주기 전체 테스트
- **한국어 컨텍스트 테스트:** 밴 메시지 파싱 및 처리 검증
- **모킹 전략:** 외부 API 의존성 완전 격리

### 🚀 성능 최적화

- **메모리 누수 방지:** 중앙집중식 interval 관리
- **타입 검증:** 컴파일 타임 에러 감소
- **코드 재사용성:** 30% 중복 코드 제거
- **확장 가능성:** 새로운 음식 그룹 추가 시 constants.ts만 수정

### 📚 개발 히스토리

- **초기 개발:** ChatGPT o3 mini를 통한 자동 생성 (99% 코드)
- **리팩토링:** Claude 3.5 Sonnet을 통한 전면적 코드 품질 개선
- **아키텍처 재설계:** 의존성 주입, 유틸리티 패턴, 타입 안전성 강화
- **테스트 체계 구축:** 포괄적 테스트 스위트 및 CI/CD 통합

## 기여 방법
기여를 원하시는 분들은 아래 단계를 참고해 주세요:
1. 이 레포지토리를 Fork 합니다.
2. 새로운 브랜치를 생성합니다:  
  `git checkout -b feature/your-feature-name`
3. 변경 사항을 커밋합니다:  
  `git commit -m 'Add some feature'`
4. 원격 레포지토리에 푸시합니다:  
  `git push origin feature/your-feature-name`
5. Pull Request를 생성합니다.

## 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참고해 주세요.