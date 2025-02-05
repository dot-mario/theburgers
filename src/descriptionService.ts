// src/descriptionService.ts
import { readFileSync, watchFile, unwatchFile } from 'fs';

export interface DescriptionData {
  burger: string[];
  chicken: string[];
  pizza: string[];
  "!play": string[];
}

export class DescriptionService {
  private descriptions: DescriptionData = {
    burger: [],
    chicken: [],
    pizza: [],
    "!play": []
  };
  private filePath: string;

  constructor(filePath: string = './descriptions.json') {
    this.filePath = filePath;
    this.loadDescriptions();
    watchFile(this.filePath, this.handleFileChange.bind(this));
  }

  private handleFileChange(): void {
    console.log('descriptions.json 변경 감지. 재로딩합니다...');
    this.loadDescriptions();
  }

  private loadDescriptions(): void {
    try {
      const data = readFileSync(this.filePath, 'utf8');
      this.descriptions = JSON.parse(data);
      console.log('Descriptions loaded from file.');
    } catch (error) {
      console.error('Descriptions 로딩 실패. 기본 설명을 사용합니다.', error);
      this.descriptions = {
        burger: ["송재욱 버거 뿌린다 ㅋㅋ"],
        chicken: ["송재욱 치킨 뿌린다 ㅋㅋ"],
        pizza: ["송재욱 피자 뿌린다 ㅋㅋ"],
        "!play": ["송재욱 공 굴린다 ㅋㅋ"]
      };
    }
  }

  public getRandomDescription(group: keyof DescriptionData): string {
    const groupDescriptions = this.descriptions[group];
    if (!groupDescriptions || groupDescriptions.length === 0) return "";
    const randomIndex = Math.floor(Math.random() * groupDescriptions.length);
    return groupDescriptions[randomIndex];
  }

  // cleanup 메서드: 파일 감시자를 해제합니다.
  public cleanup(): void {
    unwatchFile(this.filePath);
  }
}
