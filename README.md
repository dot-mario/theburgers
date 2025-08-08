# 🍔 The Burgers

<div align="center">

[![codecov](https://codecov.io/github/dot-mario/theburgers/graph/badge.svg?token=FX2D970WPE)](https://codecov.io/github/dot-mario/theburgers)
[![CI/CD Pipeline](https://github.com/dot-mario/theburgers/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/dot-mario/theburgers/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

**한국어** · [English](./docs/README.en.md)

</div>

---

> 🤖 **AI-Powered Development**: 이 프로젝트의 전체 코드의 약 99%는 ChatGPT o3 mini를 통해 자동 생성되었으며, 이후 Claude 3.5 Sonnet을 통해 전면적인 리팩토링과 **웹 인터페이스 추가**를 거쳐 코드 품질과 유지보수성을 크게 향상시켰습니다.

<div align="center">
  <a href="https://discord.gg/kV8Jy3zT">
    <img src="https://discord.com/api/guilds/1006888359249055814/widget.png?style=banner2" alt="Discord Banner 2" />
  </a>
</div>

---

## 📊 코드 커버리지

<div align="center">
  
[![codecov](https://codecov.io/github/dot-mario/theburgers/graphs/sunburst.svg?token=FX2D970WPE)](https://codecov.io/github/dot-mario/theburgers)

</div>

## 🛠️ 기술 스택

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white) |
| **Web Framework** | ![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white) |
| **Database** | ![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?logo=supabase&logoColor=white) |
| **Chat Platform** | ![Discord](https://img.shields.io/badge/Discord-Bot-5865F2?logo=discord&logoColor=white) |
| **Testing** | ![Jest](https://img.shields.io/badge/Jest-29.x-C21325?logo=jest&logoColor=white) |
| **CI/CD** | ![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI/CD-2088FF?logo=github-actions&logoColor=white) |

</div>

## 📚 전체 문서

자세한 프로젝트 정보, 설치 방법, 사용법은 다음 문서들을 참고하세요:

| Document | Description |
|----------|-------------|
| **[📖 한국어 전체 문서](./docs/README.md)** | 프로젝트 소개, 설치, 사용법 |
| **[📖 English Full Documentation](./docs/README.en.md)** | Project introduction, installation, usage |
| **[⚙️ 설정 가이드](./docs/DYNAMIC_CONFIG_SETUP.md)** | 신규 설치 및 마이그레이션 가이드 |
| **[🤖 Claude 개발 가이드](./docs/CLAUDE.md)** | AI 코딩을 위한 가이드 |

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env 파일 생성 필요)
cp .env.example .env

# Supabase 설정 및 데이터베이스 초기화
# 자세한 내용은 설정 가이드 참조

# 빌드 및 실행
npm run build
npm start

# 웹 대시보드 접속
# http://localhost:3000 에서 감지 그룹 관리

# 개발 모드
npm run dev

# 테스트
npm test
```

## 🏗️ 프로젝트 구조

```
theburgers/
├── docs/                      # 📚 문서 파일들
│   ├── README.md              # 한국어 전체 문서
│   ├── README.en.md           # 영어 전체 문서
│   ├── DYNAMIC_CONFIG_SETUP.md # 설정 가이드 (신규 설치 + 마이그레이션)
│   └── CLAUDE.md              # AI 개발 가이드
├── config/               # ⚙️ 설정 파일들
│   ├── jest.config.js    # Jest 테스트 설정
│   └── tsconfig.json     # TypeScript 설정
├── src/                  # 💻 소스 코드
│   ├── web/              # 🌐 웹 인터페이스
│   ├── config/           # ⚙️ 동적 설정 시스템
│   └── database/         # 💾 Supabase 연동
└── __tests__/            # 🧪 테스트 파일들
```

## ✨ 주요 기능

<table>
<tr>
<td>

### 💬 채팅 모니터링
- 실시간 CHZZK 채팅 감지
- 다중 채널 동시 모니터링
- 스마트 필터링 시스템

</td>
<td>

### 🔔 알림 시스템
- Discord 실시간 알림
- 사용자 정의 알림 규칙
- 밴 메시지 자동 처리

</td>
</tr>
<tr>
<td>

### 🌐 웹 인터페이스
- 직관적인 대시보드 (`localhost:3000`)
- 실시간 상태 모니터링
- 동적 설정 관리

</td>
<td>

### 🎯 감지 그룹
- 무제한 패턴 추가
- 정규식 지원
- 그룹별 액션 설정

</td>
</tr>
</table>

### 🏆 추가 특징
- **📈 85%+ 테스트 커버리지** - 안정적이고 신뢰할 수 있는 코드
- **🏗️ 모듈화된 아키텍처** - 확장 가능하고 유지보수가 쉬운 구조
- **🌏 한국어 최적화** - 한국어 밴 메시지 완벽 지원
- **⚡ 고성능** - 효율적인 리소스 사용과 빠른 응답 속도

## 🤝 기여하기

프로젝트에 기여하고 싶으신가요? 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

자세한 내용은 [기여 가이드](./docs/CONTRIBUTING.md)를 참고하세요.

## 💬 지원 & 커뮤니티

- **Discord**: [커뮤니티 참여하기](https://discord.gg/kV8Jy3zT)
- **Issues**: [버그 리포트 & 기능 제안](https://github.com/dot-mario/theburgers/issues)
- **Discussions**: [질문 & 토론](https://github.com/dot-mario/theburgers/discussions)

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참고하세요.

---

<div align="center">
  Made with ❤️ by dot-mario
  
  ⭐ **이 프로젝트가 도움이 되었다면 스타를 눌러주세요!** ⭐
</div>