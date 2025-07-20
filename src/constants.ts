// src/constants.ts
export const CHAT_CLEANUP_INTERVAL = 60 * 1000;       // 1분
export const CONNECTION_CHECK_INTERVAL = 5 * 1000;      // 5초
export const CHAT_POLL_INTERVAL = 30 * 1000;            // 30초
export const ALERT_COOLDOWN_DURATION = 5 * 60 * 1000;   // 5분
export const COUNT_RESET_INTERVAL = 60 * 1000;          // 1분
export const OLD_CHAT_THRESHOLD = 60 * 60 * 1000;       // 1시간

export const GROUP_CHARACTERS = {
  burger: ['젖', '버', '거'],
  chicken: ['젖', '치', '킨'],
  pizza: ['젖', '피', '자']
} as const;

export const GROUP_COLORS = {
  burger: 0xd4b799,
  chicken: 0xffa500,
  pizza: 0xff0000
} as const;

export const GROUP_EMOJIS = {
  burger: '🍔',
  chicken: '🍗',
  pizza: '🍕'
} as const;

export const BAN_ACTIONS = {
  ACTIVITY_BAN: '활동 제한 처리했습니다',
  TEMP_BAN: '임시 제한 처리했습니다',
  UNBAN: '활동 제한을 해제했습니다'
} as const;

export const BAN_LABELS = {
  [BAN_ACTIONS.ACTIVITY_BAN]: '[밴]',
  [BAN_ACTIONS.TEMP_BAN]: '[임차]',
  [BAN_ACTIONS.UNBAN]: '[석방]'
} as const;

export const DEFAULT_BAN_MESSAGES = {
  [BAN_ACTIONS.ACTIVITY_BAN]: '뒷밴',
  [BAN_ACTIONS.TEMP_BAN]: '뒷임차',
  [BAN_ACTIONS.UNBAN]: '석방'
} as const;
