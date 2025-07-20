# The Burgers

**한국어** · [English](./docs/README.en.md)

이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 통해 자동 생성되었으며, 이후 Claude 3.5 Sonnet을 통해 전면적인 리팩토링을 거쳐 코드 품질과 유지보수성을 크게 향상시켰습니다.

<a href="https://discord.gg/kV8Jy3zT">
  <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
</a>

## 📚 전체 문서

자세한 프로젝트 정보, 설치 방법, 사용법은 다음 문서들을 참고하세요:

- **[📖 한국어 전체 문서](./docs/README.md)** - 프로젝트 소개, 설치, 사용법
- **[📖 English Full Documentation](./docs/README.en.md)** - Project introduction, installation, usage
- **[🤖 Claude 개발 가이드](./docs/CLAUDE.md)** - AI 코딩을 위한 가이드

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성 필요)
cp .env.example .env

# 설정 파일 준비
# config/descriptions.json 파일 생성

# 빌드 및 실행
npm run build
npm start

# 개발 모드
npm run dev

# 테스트
npm test
```

## 🏗️ 프로젝트 구조

```
theburgers/
├── docs/                 # 📚 문서 파일들
│   ├── README.md         # 한국어 전체 문서
│   ├── README.en.md      # 영어 전체 문서
│   └── CLAUDE.md         # AI 개발 가이드
├── config/               # ⚙️ 설정 파일들
│   ├── jest.config.js    # Jest 테스트 설정
│   ├── tsconfig.json     # TypeScript 설정
│   └── descriptions.json # 동적 메시지 설정
├── src/                  # 💻 소스 코드
└── __tests__/            # 🧪 테스트 파일들
```

## 🔧 주요 기능

- **실시간 CHZZK 채팅 모니터링**
- **Discord 알림 시스템**
- **한국어 밴 메시지 처리**
- **모듈화된 아키텍처**
- **포괄적인 테스트 커버리지**

더 자세한 정보는 [전체 문서](./docs/README.md)를 확인하세요!

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.