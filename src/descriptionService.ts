// src/descriptionService.ts
import { DescriptionData, CleanupableService } from './types';
import { ArrayUtils } from './utils';
import { SupabaseConfigurationService } from './config/SupabaseConfigurationService';

const DEFAULT_DESCRIPTIONS: DescriptionData = {
  burger: ["송재욱 버거 뿌린다 ㅋㅋ"],
  chicken: ["송재욱 치킨 뿌린다 ㅋㅋ"],
  pizza: ["송재욱 피자 뿌린다 ㅋㅋ"],
  "!play": ["송재욱 공 굴린다 ㅋㅋ"]
};

export class DescriptionService implements CleanupableService {
  private descriptions: DescriptionData = DEFAULT_DESCRIPTIONS;
  private configService: SupabaseConfigurationService;
  private configChangeHandler = async () => {
    console.log('Configuration changed, reloading alert messages...');
    await this.loadDescriptions();
  };

  constructor(configService: SupabaseConfigurationService) {
    this.configService = configService;
  }

  async initialize(): Promise<void> {
    await this.loadDescriptions();
    this.configService.on('configChanged', this.configChangeHandler);
  }

  private async loadDescriptions(): Promise<void> {
    try {
      await this.loadFromSupabase();
      console.log('Alert messages loaded from Supabase successfully.');
    } catch (error) {
      console.error('Failed to load alert messages from Supabase. Using default descriptions.', error);
      this.descriptions = DEFAULT_DESCRIPTIONS;
    }
  }

  private async loadFromSupabase(): Promise<void> {
    const groups = await this.configService.getDetectionGroups();
    const descriptions: DescriptionData = { ...DEFAULT_DESCRIPTIONS };
    
    groups.forEach(group => {
      if (group.alert_messages) {
        descriptions[group.name] = group.alert_messages;
      } else {
        descriptions[group.name] = [];
      }
    });
    
    this.descriptions = descriptions;
  }

  public getRandomDescription(group: keyof DescriptionData): string {
    const groupDescriptions = this.descriptions[group];
    if (!groupDescriptions || groupDescriptions.length === 0) return "";
    return ArrayUtils.getRandomElement(groupDescriptions) || "";
  }

  public cleanup(): void {
    this.configService.off('configChanged', this.configChangeHandler);
  }
}
