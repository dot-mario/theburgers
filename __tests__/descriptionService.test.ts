// __tests__/descriptionService.test.ts
import { DescriptionService } from '../src/descriptionService';
import { DescriptionData } from '../src/types';
import { readFileSync, watchFile, unwatchFile } from 'fs';

jest.mock('fs');
const mockedReadFileSync = readFileSync as jest.Mock;
const mockedWatchFile = watchFile as jest.Mock;
const mockedUnwatchFile = unwatchFile as jest.Mock;

describe('DescriptionService', () => {
  let service: DescriptionService;

  afterEach(() => {
    if (service) {
      service.cleanup();
    }
    jest.resetAllMocks();
  });

  it('should load descriptions from file', () => {
    const fakeData: DescriptionData = {
      burger: ["버거 설명1", "버거 설명2"],
      chicken: ["치킨 설명1"],
      pizza: ["피자 설명1"],
      "!play": ["플레이 설명1"]
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(fakeData));
    
    service = new DescriptionService('./fake-descriptions.json');
    
    const burgerDescription = service.getRandomDescription('burger');
    expect(fakeData.burger).toContain(burgerDescription);
    
    expect(mockedWatchFile).toHaveBeenCalledWith('./fake-descriptions.json', expect.any(Function));
  });

  it('should use default descriptions when file reading fails', () => {
    mockedReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    
    service = new DescriptionService('./non-existent.json');
    const description = service.getRandomDescription('burger');
    expect(description).toBe("송재욱 버거 뿌린다 ㅋㅋ");
  });

  it('should return random descriptions from multiple options', () => {
    const fakeData: DescriptionData = {
      burger: ["버거1", "버거2", "버거3", "버거4", "버거5"],
      chicken: ["치킨1"],
      pizza: ["피자1"],
      "!play": ["플레이1"]
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(fakeData));
    
    service = new DescriptionService('./fake-descriptions.json');
    
    // 여러 번 호출해서 다양한 결과가 나오는지 확인
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(service.getRandomDescription('burger'));
    }
    
    // 최소 2개 이상의 다른 결과가 나와야 함 (랜덤성 확인)
    expect(results.size).toBeGreaterThan(1);
    results.forEach(result => {
      expect(fakeData.burger).toContain(result);
    });
  });

  it('should return empty string for empty description array', () => {
    const fakeData: DescriptionData = {
      burger: [],
      chicken: ["치킨1"],
      pizza: ["피자1"],
      "!play": ["플레이1"]
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(fakeData));
    
    service = new DescriptionService('./fake-descriptions.json');
    const description = service.getRandomDescription('burger');
    expect(description).toBe("");
  });

  it('should return empty string for non-existent group', () => {
    const fakeData: DescriptionData = {
      burger: ["버거1"],
      chicken: ["치킨1"],
      pizza: ["피자1"],
      "!play": ["플레이1"]
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(fakeData));
    
    service = new DescriptionService('./fake-descriptions.json');
    const description = service.getRandomDescription('nonexistent' as keyof DescriptionData);
    expect(description).toBe("");
  });

  it('should handle file watch events', () => {
    const initialData: DescriptionData = {
      burger: ["초기 버거"],
      chicken: ["초기 치킨"],
      pizza: ["초기 피자"],
      "!play": ["초기 플레이"]
    };
    
    const updatedData: DescriptionData = {
      burger: ["업데이트된 버거"],
      chicken: ["업데이트된 치킨"],
      pizza: ["업데이트된 피자"],
      "!play": ["업데이트된 플레이"]
    };

    mockedReadFileSync
      .mockReturnValueOnce(JSON.stringify(initialData))
      .mockReturnValueOnce(JSON.stringify(updatedData));

    service = new DescriptionService('./fake-descriptions.json');
    
    // 초기 로드 확인
    expect(service.getRandomDescription('burger')).toBe("초기 버거");
    
    // 파일 변경 이벤트 시뮬레이션
    const fileChangeHandler = mockedWatchFile.mock.calls[0][1];
    fileChangeHandler();
    
    // 업데이트된 내용 확인
    expect(service.getRandomDescription('burger')).toBe("업데이트된 버거");
  });

  it('should cleanup file watcher on cleanup', () => {
    const fakeData: DescriptionData = {
      burger: ["버거1"],
      chicken: ["치킨1"],
      pizza: ["피자1"],
      "!play": ["플레이1"]
    };
    mockedReadFileSync.mockReturnValue(JSON.stringify(fakeData));
    
    service = new DescriptionService('./fake-descriptions.json');
    service.cleanup();
    
    expect(mockedUnwatchFile).toHaveBeenCalledWith('./fake-descriptions.json');
  });

  it('should handle JSON parsing errors gracefully', () => {
    mockedReadFileSync.mockReturnValue('invalid json {');
    
    service = new DescriptionService('./invalid.json');
    
    // 기본값으로 폴백해야 함
    const description = service.getRandomDescription('burger');
    expect(description).toBe("송재욱 버거 뿌린다 ㅋㅋ");
  });
});
