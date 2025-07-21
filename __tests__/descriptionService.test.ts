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
    mockConfigService.on = jest.fn();
    mockConfigService.off = jest.fn();
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

  it('should reload descriptions when configuration changes', async () => {
    // Initial setup
    mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);
    let configChangeHandler: () => Promise<void> = async () => {};
    mockConfigService.on.mockImplementation((event: string | symbol, handler: (...args: any[]) => void) => {
      if (event === 'configChanged') {
        configChangeHandler = handler as () => Promise<void>;
      }
      return mockConfigService;
    });

    await service.initialize();

    // First check
    let burgerDescription = service.getRandomDescription('burger');
    expect(['버거 설명1', '버거 설명2']).toContain(burgerDescription);
    expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(1);

    // Simulate configuration change
    const updatedGroups: DetectionGroup[] = [
      { ...mockGroups[0], alert_messages: ['새로운 버거 설명'] },
      mockGroups[1]
    ];
    mockConfigService.getDetectionGroups.mockResolvedValue(updatedGroups);

    // Trigger the event
    await configChangeHandler();

    // Second check
    burgerDescription = service.getRandomDescription('burger');
    expect(burgerDescription).toBe('새로운 버거 설명');
    expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(2);
  });

  it('should remove event listener on cleanup', async () => {
    mockConfigService.getDetectionGroups.mockResolvedValue(mockGroups);

    await service.initialize();
    service.cleanup();

    expect(mockConfigService.on).toHaveBeenCalledWith('configChanged', expect.any(Function));
    expect(mockConfigService.off).toHaveBeenCalledWith('configChanged', expect.any(Function));
  });
});