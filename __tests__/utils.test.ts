import { DateUtils, BanUtils, ArrayUtils, IntervalManager } from '../src/utils';
import { BAN_ACTIONS } from '../src/constants';

describe('DateUtils', () => {
  it('should format date correctly', () => {
    const testDate = new Date('2023-12-25T14:30:45.123Z');
    const formatted = DateUtils.formatDateTime(testDate);
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('should handle different dates consistently', () => {
    const date1 = new Date(2023, 0, 1, 12, 0, 0); // Local time 2023-01-01 12:00:00
    const date2 = new Date(2023, 11, 31, 12, 0, 0); // Local time 2023-12-31 12:00:00
    
    const formatted1 = DateUtils.formatDateTime(date1);
    const formatted2 = DateUtils.formatDateTime(date2);
    
    expect(formatted1).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(formatted2).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(formatted1).toContain('2023');
    expect(formatted2).toContain('2023');
  });
});

describe('BanUtils', () => {
  describe('parseBanMessage', () => {
    it('should parse activity ban message correctly', () => {
      const message = "관리자님이 사용자님을 활동 제한 처리했습니다";
      const result = BanUtils.parseBanMessage(message);
      
      expect(result).toEqual({
        issuer: '관리자',
        target: '사용자',
        action: '활동 제한 처리했습니다'
      });
    });

    it('should parse temp ban message correctly', () => {
      const message = "모더레이터님이 트롤러님을 임시 제한 처리했습니다";
      const result = BanUtils.parseBanMessage(message);
      
      expect(result).toEqual({
        issuer: '모더레이터',
        target: '트롤러',
        action: '임시 제한 처리했습니다'
      });
    });

    it('should parse unban message correctly', () => {
      const message = "관리자님이 사용자님을 활동 제한을 해제했습니다";
      const result = BanUtils.parseBanMessage(message);
      
      expect(result).toEqual({
        issuer: '관리자',
        target: '사용자',
        action: '활동 제한을 해제했습니다'
      });
    });

    it('should return null for invalid message format', () => {
      const invalidMessage = "잘못된 메시지 형식입니다";
      const result = BanUtils.parseBanMessage(invalidMessage);
      
      expect(result).toBeNull();
    });

    it('should handle messages with extra whitespace', () => {
      const message = "관리자 님이   사용자 님을   활동 제한 처리했습니다";
      const result = BanUtils.parseBanMessage(message);
      
      expect(result).toEqual({
        issuer: '관리자',
        target: '사용자',
        action: '활동 제한 처리했습니다'
      });
    });
  });

  describe('getBanLabel', () => {
    it('should return correct label for activity ban', () => {
      const label = BanUtils.getBanLabel(BAN_ACTIONS.ACTIVITY_BAN);
      expect(label).toBe('[밴]');
    });

    it('should return correct label for temp ban', () => {
      const label = BanUtils.getBanLabel(BAN_ACTIONS.TEMP_BAN);
      expect(label).toBe('[임차]');
    });

    it('should return correct label for unban', () => {
      const label = BanUtils.getBanLabel(BAN_ACTIONS.UNBAN);
      expect(label).toBe('[석방]');
    });

    it('should return null for unknown action', () => {
      const label = BanUtils.getBanLabel('알 수 없는 액션');
      expect(label).toBeNull();
    });
  });

  describe('getDefaultMessage', () => {
    it('should return correct default message for activity ban', () => {
      const message = BanUtils.getDefaultMessage(BAN_ACTIONS.ACTIVITY_BAN);
      expect(message).toBe('뒷밴');
    });

    it('should return correct default message for temp ban', () => {
      const message = BanUtils.getDefaultMessage(BAN_ACTIONS.TEMP_BAN);
      expect(message).toBe('뒷임차');
    });

    it('should return correct default message for unban', () => {
      const message = BanUtils.getDefaultMessage(BAN_ACTIONS.UNBAN);
      expect(message).toBe('석방');
    });

    it('should return null for unknown action', () => {
      const message = BanUtils.getDefaultMessage('알 수 없는 액션');
      expect(message).toBeNull();
    });
  });

  describe('formatBanMessage', () => {
    it('should format ban message with ban initiator', () => {
      const banInfo = {
        issuer: '관리자',
        target: '사용자',
        action: BAN_ACTIONS.ACTIVITY_BAN
      };
      const chatMessage = '나쁜 말';
      const streamerName = '스트리머';
      const timestamp = '2023-12-25 14:30:45';

      const result = BanUtils.formatBanMessage(banInfo, chatMessage, streamerName, timestamp);
      
      expect(result).toBe('```[2023-12-25 14:30:45] [밴] <사용자> (banned by <관리자>) : 나쁜 말```');
    });

    it('should format ban message without ban initiator when issuer is streamer', () => {
      const banInfo = {
        issuer: '스트리머',
        target: '사용자',
        action: BAN_ACTIONS.ACTIVITY_BAN
      };
      const chatMessage = '나쁜 말';
      const streamerName = '스트리머';
      const timestamp = '2023-12-25 14:30:45';

      const result = BanUtils.formatBanMessage(banInfo, chatMessage, streamerName, timestamp);
      
      expect(result).toBe('```[2023-12-25 14:30:45] [밴] <사용자> : 나쁜 말```');
    });

    it('should return empty string for unknown action', () => {
      const banInfo = {
        issuer: '관리자',
        target: '사용자',
        action: '알 수 없는 액션'
      };
      const chatMessage = '메시지';
      const streamerName = '스트리머';
      const timestamp = '2023-12-25 14:30:45';

      const result = BanUtils.formatBanMessage(banInfo, chatMessage, streamerName, timestamp);
      
      expect(result).toBe('');
    });
  });
});

describe('ArrayUtils', () => {
  describe('getRandomElement', () => {
    it('should return undefined for empty array', () => {
      const result = ArrayUtils.getRandomElement([]);
      expect(result).toBeUndefined();
    });

    it('should return the only element for single-element array', () => {
      const array = ['only-element'];
      const result = ArrayUtils.getRandomElement(array);
      expect(result).toBe('only-element');
    });

    it('should return one of the elements for multi-element array', () => {
      const array = ['a', 'b', 'c', 'd'];
      const result = ArrayUtils.getRandomElement(array);
      expect(array).toContain(result);
    });

    it('should distribute elements roughly evenly over multiple calls', () => {
      const array = ['a', 'b'];
      const results = new Set();
      
      // 여러 번 호출해서 두 요소 모두 나올 가능성을 높임
      for (let i = 0; i < 100; i++) {
        results.add(ArrayUtils.getRandomElement(array));
      }
      
      expect(results.size).toBeGreaterThan(1);
    });
  });
});

describe('IntervalManager', () => {
  let intervalManager: IntervalManager;

  beforeEach(() => {
    intervalManager = new IntervalManager();
    jest.useFakeTimers();
  });

  afterEach(() => {
    intervalManager.clearAllIntervals();
    jest.useRealTimers();
  });

  it('should create and manage intervals', () => {
    const callback = jest.fn();
    const intervalId = intervalManager.createInterval(callback, 1000);

    expect(callback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    intervalManager.clearInterval(intervalId);
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should clear all intervals', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    
    intervalManager.createInterval(callback1, 1000);
    intervalManager.createInterval(callback2, 500);

    jest.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(2);

    intervalManager.clearAllIntervals();
    jest.advanceTimersByTime(1000);
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(2);
  });

  it('should handle clearing non-existent interval gracefully', () => {
    const intervalId = setInterval(() => {}, 1000);
    expect(() => {
      intervalManager.clearInterval(intervalId);
    }).not.toThrow();
    clearInterval(intervalId);
  });
});