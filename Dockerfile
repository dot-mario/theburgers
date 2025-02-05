# === Stage 1: Build ===
FROM node:20-alpine AS builder

# 작업 디렉토리를 /app으로 설정
WORKDIR /app

# 시간대 데이터 패키지 설치 및 환경 변수 설정
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone

# package.json 및 package-lock.json (또는 yarn.lock) 복사 및 모든 의존성 설치 (devDependencies 포함)
COPY package*.json ./
RUN npm install

# 프로젝트의 모든 파일 복사 (.env, tsconfig.json, index.ts, descriptions.json 등)
COPY . .

# TypeScript 컴파일 (tsconfig.json의 outDir 설정에 따라 결과물이 ./dist 폴더에 생성됨)
RUN npx tsc

# === Stage 2: Production ===
FROM node:20-alpine

WORKDIR /app

# 시간대 데이터 패키지 설치 및 환경 변수 설정
RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime \
    && echo "Asia/Seoul" > /etc/timezone

# 프로덕션 의존성만 설치 (빌드에 사용한 package.json 사용)
COPY package*.json ./
RUN npm install --production

# 빌드 스테이지에서 생성된 결과물과 필요한 정적 파일들(.env, descriptions.json)을 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/descriptions.json ./descriptions.json
COPY --from=builder /app/.env ./.env

# 컨테이너 실행 시, 빌드된 메인 파일을 실행 (여기서는 dist/index.js)
CMD ["node", "dist/index.js"]
