// __tests__/descriptionService.test.ts
import { DescriptionService } from '../src/descriptionService';
import { SupabaseConfigurationService } from '../src/config/SupabaseConfigurationService';
import { DetectionGroup } from '../src/types/database';

jest.mock('../src/config/SupabaseConfigurationService');

describe('DescriptionService', () => {
  let service: DescriptionService;
  let mockConfigService: jest.Mocked<SupabaseConfigurationService>;

  const mockGroups: DetectionGroup[] = [
    {
      id: '1', name: 'burger', display_name: '버거', characters: [],
      alert_messages: ['버거 설명1', '버거 설명2'],
      color: 0, emoji: '🍔', enabled: true, threshold: 5
    },
    {
      id: '2', name: 'chicken', display_name: '치킨', characters: [],
      alert_messages: ['치킨 설명1'],
      color: 0, emoji: '🍗', enabled: true, threshold: 5
    }
  ];

  beforeEach(() => {
    mockConfigService = new SupabaseConfigurationService() as jest.Mocked<SupabaseConfigurationService>;
    mockConfigService.getDetectionGroups = jest.fn();
    service = new DescriptionService(mockConfigService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should load descriptions from Supabase', async () => {
    mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);
    
    await service.initialize();
    
    const burgerDescription = service.getRandomDescription('burger');
    expect(['버거 설명1', '버거 설명2']).toContain(burgerDescription);
    expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(1);
  });

  it('should use default descriptions when Supabase fails', async () => {
    mockConfigService.getDetectionGroups.mockRejectedValue(new Error('Supabase error'));
    
    await service.initialize();

    const description = service.getRandomDescription('burger');
    expect(description).toBe("송재욱 버거 뿌린다 ㅋㅋ");
  });

  it('should return random descriptions from multiple options', async () => {
    mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);
    await service.initialize();
    
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(service.getRandomDescription('burger'));
    }
    
    expect(results.size).toBeGreaterThan(1);
    results.forEach(result => {
      expect(['버거 설명1', '버거 설명2']).toContain(result);
    });
  });

  it('should return empty string for group with no alert messages', async () => {
    const groupsWithEmptyAlerts: DetectionGroup[] = [{
      id: '3', name: 'pizza', display_name: '피자', characters: [],
      alert_messages: [],
      color: 0, emoji: '🍕', enabled: true, threshold: 5
    }];
    mockConfigService.getDetectionGroups.mockResolvedValue(groupsWithEmptyAlerts);
    await service.initialize();

    const description = service.getRandomDescription('pizza');
    expect(description).toBe("");
  });

  it('should return empty string for non-existent group', async () => {
    mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);
    await service.initialize();

    const description = service.getRandomDescription('nonexistent' as any);
    expect(description).toBe("");
  });
});