// src/utils.ts
import { format } from 'date-fns';
import { BanInfo } from './types';
import { BAN_ACTIONS, BAN_LABELS, DEFAULT_BAN_MESSAGES } from './constants';

export class DateUtils {
  static formatDateTime(date: Date): string {
    return format(date, "yyyy-MM-dd HH:mm:ss");
  }
}

export class BanUtils {
  private static readonly BAN_REGEX = /^(?<issuer>.+?)님이\s+(?<target>.+?)님을\s+(?<action>활동 제한 처리했습니다|임시 제한 처리했습니다|활동 제한을 해제했습니다)/;

  static parseBanMessage(description: string): BanInfo | null {
    const match = description.match(this.BAN_REGEX);
    if (!match || !match.groups) {
      return null;
    }

    return {
      issuer: match.groups.issuer.trim(),
      target: match.groups.target.trim(),
      action: match.groups.action.trim()
    };
  }

  static getBanLabel(action: string): string | null {
    const actionKey = Object.values(BAN_ACTIONS).find(a => a === action);
    return actionKey ? BAN_LABELS[actionKey as keyof typeof BAN_LABELS] : null;
  }

  static getDefaultMessage(action: string): string | null {
    const actionKey = Object.values(BAN_ACTIONS).find(a => a === action);
    return actionKey ? DEFAULT_BAN_MESSAGES[actionKey as keyof typeof DEFAULT_BAN_MESSAGES] : null;
  }

  static formatBanMessage(
    banInfo: BanInfo,
    chatMessage: string,
    streamerName: string,
    timestamp: string
  ): string {
    const label = this.getBanLabel(banInfo.action);
    if (!label) return '';

    const banInitiator = banInfo.issuer !== streamerName ? banInfo.issuer : null;
    
    return banInitiator
      ? `\`\`\`[${timestamp}] ${label} <${banInfo.target}> (banned by <${banInitiator}>) : ${chatMessage}\`\`\``
      : `\`\`\`[${timestamp}] ${label} <${banInfo.target}> : ${chatMessage}\`\`\``;
  }
}

export class ArrayUtils {
  static getRandomElement<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }
}

export class IntervalManager {
  private intervals: Set<NodeJS.Timeout> = new Set();

  createInterval(callback: () => void, delay: number): NodeJS.Timeout {
    const intervalId = setInterval(callback, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  clearInterval(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId);
    this.intervals.delete(intervalId);
  }

  clearAllIntervals(): void {
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
  }
}