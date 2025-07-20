// src/types.ts
export type GroupType = 'burger' | 'chicken' | 'pizza';

export interface ChatInfo {
  message: string;
  time: Date;
}

export interface GroupCount {
  [letter: string]: number;
}

export interface DescriptionData {
  burger: string[];
  chicken: string[];
  pizza: string[];
  "!play": string[];
}

export interface BanInfo {
  issuer: string;
  target: string;
  action: string;
}

export interface CleanupableService {
  cleanup(): void;
}