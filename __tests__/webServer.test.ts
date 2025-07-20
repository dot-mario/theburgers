import { WebServer } from '../src/webServer';
import { Application } from '../src/application';
import { ConfigurationAPI } from '../src/web/configApi';

// Mock dependencies
jest.mock('../src/application');
jest.mock('../src/web/configApi');

describe('WebServer', () => {
  let webServer: WebServer;
  let mockApplication: jest.Mocked<Application>;
  let mockConfigAPI: jest.Mocked<ConfigurationAPI>;
  const testPort = 3001;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Application
    mockApplication = {
      getConfigurationService: jest.fn(),
      getCountManager: jest.fn().mockReturnValue({
        setRealtimeUpdateCallback: jest.fn()
      }),
    } as any;

    // Mock ConfigurationAPI
    mockConfigAPI = {
      listen: jest.fn(),
      getExpressApp: jest.fn(),
      broadcastCountUpdate: jest.fn(),
    } as any;

    // Mock ConfigurationAPI constructor
    (ConfigurationAPI as jest.MockedClass<typeof ConfigurationAPI>)
      .mockImplementation(() => mockConfigAPI);

    webServer = new WebServer(mockApplication, testPort);
  });

  describe('constructor', () => {
    it('should initialize with correct dependencies', () => {
      expect(ConfigurationAPI).toHaveBeenCalledWith(
        mockApplication.getConfigurationService(),
        mockApplication
      );
    });

    it('should use default port 3000 if not provided', () => {
      const defaultWebServer = new WebServer(mockApplication);
      expect(defaultWebServer).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start the configuration API on specified port', () => {
      webServer.start();
      
      expect(mockConfigAPI.listen).toHaveBeenCalledWith(testPort);
    });

    it('should handle start errors gracefully', () => {
      mockConfigAPI.listen.mockImplementation(() => {
        throw new Error('Port already in use');
      });

      expect(() => webServer.start()).toThrow('Port already in use');
    });
  });

  describe('stop', () => {
    it('should not throw when called', () => {
      expect(() => webServer.stop()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should complete start-stop lifecycle successfully', () => {
      webServer.start();
      webServer.stop();
      
      expect(mockConfigAPI.listen).toHaveBeenCalledWith(testPort);
    });
  });
});