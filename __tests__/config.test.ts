// 테스트 실행 전에 환경변수를 지정합니다.
process.env.DISCORD_TOKEN = 'test_token';
process.env.DISCORD_ALERT_CHANNEL_ID = 'test_alert';
process.env.DISCORD_BAN_CHANNEL_ID = 'test_ban';
process.env.NID_AUTH = 'test_auth';
process.env.NID_SESSION = 'test_session';

import { CONFIG } from '../src/config';

describe('Config Module', () => {
  it('should have required environment variables', () => {
    expect(CONFIG.DISCORD_TOKEN).toBe('test_token');
    expect(CONFIG.DISCORD_ALERT_CHANNEL_ID).toBe('test_alert');
    expect(CONFIG.DISCORD_BAN_CHANNEL_ID).toBe('test_ban');
    expect(CONFIG.NID_AUTH).toBe('test_auth');
    expect(CONFIG.NID_SESSION).toBe('test_session');
    // STREAMER는 코드에 하드코딩 되어 있음
    expect(CONFIG.STREAMER).toBe('쟁구');
  });
});
