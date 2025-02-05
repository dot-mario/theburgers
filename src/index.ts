// src/index.ts
import { DiscordService } from './discordService';
import { DescriptionService } from './descriptionService';
import { CountManager } from './countManager';
import { ChzzkService } from './chzzkService';
import { CONFIG } from './config';

async function main() {
  // Discord 서비스 초기화 및 로그인
  const discordService = new DiscordService();
  await discordService.login();

  // Description 서비스 초기화 (동적 문구 로딩)
  const descriptionService = new DescriptionService('./descriptions.json');

  // CountManager 초기화 (단어/문구 카운팅 및 알림 처리)
  const countManager = new CountManager(CONFIG.COUNT_THRESHOLD, descriptionService, discordService);

  // Chzzk 서비스 초기화 및 시작
  const chzzkService = new ChzzkService(countManager, discordService);
  await chzzkService.start();
}

main().catch(console.error);
