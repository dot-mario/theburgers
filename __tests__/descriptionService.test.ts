// __tests__/descriptionService.test.ts
import { DescriptionService } from '../src/descriptionService';
import { readFileSync } from 'fs';
jest.mock('fs');
const mockedReadFileSync = readFileSync as jest.Mock;

describe('DescriptionService', () => {
  let service: DescriptionService;

  afterEach(() => {
    if (service) {
      service.cleanup();
    }
    jest.resetAllMocks();
  });

  it('should load descriptions from file', () => {
    const fakeData = JSON.stringify({
      burger: ["버거 설명1"],
      chicken: ["치킨 설명1"],
      pizza: ["피자 설명1"],
      "!play": ["플레이 설명1"]
    });
    mockedReadFileSync.mockReturnValue(fakeData);
    service = new DescriptionService('./fake-descriptions.json');
    const description = service.getRandomDescription('burger');
    expect(["버거 설명1"]).toContain(description);
  });

  it('should use default descriptions when file reading fails', () => {
    mockedReadFileSync.mockImplementation(() => {
      throw new Error('File not found');
    });
    service = new DescriptionService('./non-existent.json');
    const description = service.getRandomDescription('burger');
    expect(description).toBe("송재욱 버거 뿌린다 ㅋㅋ");
  });
});
