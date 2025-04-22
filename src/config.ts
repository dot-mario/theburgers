// src/config.ts
import dotenv from 'dotenv';
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const CONFIG = {
  DISCORD_TOKEN: getEnv('DISCORD_TOKEN'),
  DISCORD_ALERT_CHANNEL_ID: getEnv('DISCORD_ALERT_CHANNEL_ID'),
  DISCORD_BAN_CHANNEL_ID: getEnv('DISCORD_BAN_CHANNEL_ID'),
  NID_AUTH: getEnv('NID_AUTH', ''),
  NID_SESSION: getEnv('NID_SESSION', ''),
  STREAMER: "쟁구임",
  COUNT_THRESHOLD: 5,
  CHZZK_LIVE_URL: "https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369",
};
