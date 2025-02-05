# === Stage 1: Build ===
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 시간대 데이터 설치 및 설정
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone

# package.json 및 package-lock.json (또는 yarn.lock) 복사 후 의존성 설치
COPY package*.json ./
RUN npm install

# 전체 소스 복사 (src/ 폴더, .env, descriptions.json 등)
COPY . ./

# TypeScript 컴파일 (결과물은 dist/ 폴더에 생성)
RUN npm run build

# === Stage 2: Production ===
FROM node:20-alpine

WORKDIR /app

# 시간대 데이터 설치 및 설정
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Seoul /etc/localtime && \
    echo "Asia/Seoul" > /etc/timezone

# 프로덕션 의존성만 설치
COPY package*.json ./
RUN npm install --production

# 빌드 결과물과 필요한 파일들 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/descriptions.json ./descriptions.json
# COPY --from=builder /app/.env ./.env

# 컨테이너 실행 시, 빌드된 메인 파일 실행
CMD ["node", "dist/index.js"]
