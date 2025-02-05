// src/config.ts
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }

export const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  DISCORD_ALERT_CHANNEL_ID: process.env.DISCORD_ALERT_CHANNEL_ID!,
  DISCORD_BAN_CHANNEL_ID: process.env.DISCORD_BAN_CHANNEL_ID!,
  NID_AUTH: process.env.NID_AUTH,
  NID_SESSION: process.env.NID_SESSION,
  STREAMER: "쟁구",
  COUNT_THRESHOLD: 10,
  CHZZK_LIVE_URL: "https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369",
};

if (!CONFIG.DISCORD_TOKEN || !CONFIG.DISCORD_ALERT_CHANNEL_ID || !CONFIG.DISCORD_BAN_CHANNEL_ID) {
  console.error("필수 환경변수가 누락되었습니다.");
  process.exit(1);
}
