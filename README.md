# The Burgers

**주의:** 이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 통해 자동 생성되었습니다.  
  
![Discord Banner 2](https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2)

## 프로젝트 소개

**The Burgers**는 CHZZK 채팅 서비스와 Discord를 연동하여, 특정 단어 또는 명령어가 일정 횟수 이상 입력되면 자동으로 Discord 채널에 알림 메시지를 전송하는 봇입니다.  
주요 기능은 다음과 같습니다:

- **실시간 채팅 모니터링:**  
  CHZZK 채팅 서버에 연결하여 스트리머 채널의 채팅 메시지를 모니터링합니다.
  
- **단어/문구 카운팅:**  
  특정 그룹(예: burger, chicken, pizza)별로 단어(예: '젖', '버', '거' 등)의 입력 횟수를 카운팅합니다.  
  `!play` 명령어의 입력 횟수를 별도로 카운팅합니다.
  
- **알림 전송:**  
  각 그룹의 카운트가 사전에 정해진 임계값(예: 10)에 도달하면 Discord 채널로 임베디드 메시지를 전송합니다.  
  시스템 메시지(예: 활동 제한, 임시 제한, 해제) 이벤트 발생 시에도 Discord 채널로 알림 메시지를 전송합니다.
  
- **동적 설명 문구:**  
  `descriptions.json` 파일에서 동적으로 설명 문구를 로드하며, 파일 변경을 감지하여 실시간으로 반영합니다.
  
- **리소스 관리:**  
  각 모듈(예: `descriptionService`, `countManager`, `chzzkService`)에서 타이머(setInterval)와 파일 감시자(watchFile) 등의 리소스를 관리하기 위해 cleanup 메서드를 제공하여, 테스트 또는 애플리케이션 종료 시 리소스 누수를 방지합니다.

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
│   ├── config.ts             # 환경변수 및 설정 관리 모듈
│   ├── descriptionService.ts # 파일 로딩, watchFile, cleanup 메서드 포함
│   ├── discordService.ts     # Discord 클라이언트 및 메시지 전송 모듈
│   ├── countManager.ts       # 단어/문구 카운팅, 타이머, cleanup 메서드 포함
│   ├── chzzkService.ts       # CHZZK 클라이언트, 이벤트 핸들러, cleanup 메서드 포함
│   └── index.ts              # 애플리케이션 엔트리 포인트
└── __tests__/                # 테스트 파일 디렉터리
    ├── config.test.ts            # config 모듈 테스트
    ├── descriptionService.test.ts  # descriptionService 모듈 테스트 (cleanup 포함)
    ├── discordService.test.ts      # discordService 모듈 테스트
    ├── countManager.test.ts        # countManager 모듈 테스트 (cleanup 포함)
    └── chzzkService.test.ts        # chzzkService 모듈 테스트 (cleanup 포함)

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
  "pizza": ["송재욱 피자 뿌린다 ㅋㅋ"],
  "!play": ["송재욱 공 굴린다 ㅋㅋ"]
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
모든 테스트가 통과하면 각 모듈의 기능과 cleanup 메서드가 정상 작동하는 것을 확인할 수 있습니다.

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

## 추가 정보
- **Cleanup 메서드:**
  각 모듈(descriptionService, countManager, chzzkService)에 cleanup 메서드를 추가하여, setInterval이나 watchFile과 같이 지속적으로 실행되는 리소스를 테스트 종료 또는 애플리케이션 종료 시 정리합니다.

- **모듈화:**
  코드가 기능별로 명확하게 분리되어 있어, 유지보수 및 확장이 용이합니다.  
  예를 들어, Discord 관련 기능은 discordService.ts에, 카운팅 및 알림 기능은 countManager.ts에 구현되어 있습니다.

- **외부 API 모의(Mock):**
  테스트 환경에서는 Discord, CHZZK와 같은 외부 API 호출을 모의(Mock)하여 단위 테스트의 신뢰성을 높였습니다.

- **자동 생성 코드:**
   이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 사용하여 자동 생성되었습니다. 이 점은 빠른 프로토타이핑 및 초기 개발 단계에서 큰 도움이 되었으며, 코드의 구조와 유지보수성을 높이는데 기여했습니다.

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