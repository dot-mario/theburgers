// src/descriptionService.ts
import { readFileSync, watchFile, unwatchFile } from 'fs';
import { DescriptionData, CleanupableService } from './types';
import { ArrayUtils } from './utils';

const DEFAULT_DESCRIPTIONS: DescriptionData = {
  burger: ["송재욱 버거 뿌린다 ㅋㅋ"],
  chicken: ["송재욱 치킨 뿌린다 ㅋㅋ"],
  pizza: ["송재욱 피자 뿌린다 ㅋㅋ"],
  "!play": ["송재욱 공 굴린다 ㅋㅋ"]
};

export class DescriptionService implements CleanupableService {
  private descriptions: DescriptionData = DEFAULT_DESCRIPTIONS;
  private filePath: string;

  constructor(filePath: string = './descriptions.json') {
    this.filePath = filePath;
    this.loadDescriptions();
    watchFile(this.filePath, this.handleFileChange.bind(this));
  }

  private handleFileChange(): void {
    console.log('descriptions.json change detected. Reloading...');
    this.loadDescriptions();
  }

  private loadDescriptions(): void {
    try {
      const data = readFileSync(this.filePath, 'utf8');
      this.descriptions = JSON.parse(data);
      console.log('Descriptions loaded successfully.');
    } catch (error) {
      console.error('Failed to load descriptions. Using default descriptions.', error);
      this.descriptions = DEFAULT_DESCRIPTIONS;
    }
  }

  public getRandomDescription(group: keyof DescriptionData): string {
    const groupDescriptions = this.descriptions[group];
    if (!groupDescriptions || groupDescriptions.length === 0) return "";
    return ArrayUtils.getRandomElement(groupDescriptions) || "";
  }

  public cleanup(): void {
    unwatchFile(this.filePath);
  }
}
