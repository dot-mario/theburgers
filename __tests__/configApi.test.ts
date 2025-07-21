import request from 'supertest';
import express from 'express';
import { ConfigurationAPI } from '../src/web/configApi';
import { SupabaseConfigurationService } from '../src/config/SupabaseConfigurationService';
import { Application } from '../src/application';
import { DetectionGroup } from '../src/types/database';

// Mock dependencies
jest.mock('../src/config/SupabaseConfigurationService');
jest.mock('../src/application');

describe('ConfigurationAPI', () => {
  let configAPI: ConfigurationAPI;
  let mockConfigService: jest.Mocked<SupabaseConfigurationService>;
  let mockMainApp: jest.Mocked<Application>;
  let app: express.Application;

  const mockGroup: DetectionGroup = {
    id: 'test-id',
    name: 'test-group',
    display_name: '테스트 그룹',
    characters: ['테', '스', '트'],
    alert_messages: [],
    color: 0xff0000,
    emoji: '🧪',
    enabled: true,
    threshold: 5
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock SupabaseConfigurationService
    mockConfigService = {
      getDetectionGroups: jest.fn(),
      createDetectionGroup: jest.fn(),
      updateDetectionGroup: jest.fn(),
      deleteDetectionGroup: jest.fn(),
      loadConfiguration: jest.fn(),
      updateSystemSetting: jest.fn(),
    } as any;

    // Mock Application
    mockMainApp = {
      refreshConfiguration: jest.fn(),
    } as any;

    configAPI = new ConfigurationAPI(mockConfigService, mockMainApp);
    app = configAPI.getExpressApp();
  });

  describe('GET /api/config/groups', () => {
    it('should return groups successfully', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue([mockGroup]);

      const response = await request(app)
        .get('/api/config/groups')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [mockGroup]
      });
      expect(mockConfigService.getDetectionGroups).toHaveBeenCalledTimes(1);
    });

    it('should handle service errors', async () => {
      mockConfigService.getDetectionGroups.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/config/groups')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to get groups'
      });
    });
  });

  describe('POST /api/config/groups', () => {
    const newGroupData = {
      name: 'new-group',
      display_name: '새 그룹',
      characters: ['새', '그', '룹'],
      alert_messages: [],
      color: 0x00ff00,
      emoji: '🆕',
      enabled: true,
      threshold: 3
    };

    it('should create group successfully', async () => {
      mockConfigService.createDetectionGroup.mockResolvedValue({
        ...newGroupData,
        alert_messages: [],
        id: 'new-id'
      });

      const response = await request(app)
        .post('/api/config/groups')
        .send(newGroupData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: { ...newGroupData, id: 'new-id' }
      });
      expect(mockConfigService.createDetectionGroup).toHaveBeenCalledWith(newGroupData);
    });

    it('should validate required fields', async () => {
      const invalidData = { name: '' };

      const response = await request(app)
        .post('/api/config/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should validate characters array', async () => {
      const invalidData = {
        ...newGroupData,
        characters: []
      };

      const response = await request(app)
        .post('/api/config/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('character');
    });

    it('should validate color range', async () => {
      const invalidData = {
        ...newGroupData,
        color: -1
      };

      const response = await request(app)
        .post('/api/config/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('color');
    });

    it('should validate threshold range', async () => {
      const invalidData = {
        ...newGroupData,
        threshold: 101
      };

      const response = await request(app)
        .post('/api/config/groups')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Threshold');
    });
  });

  describe('PUT /api/config/groups/:id', () => {
    const updateData = {
      name: 'updated-group',
      display_name: '업데이트된 그룹',
      characters: ['업', '데', '이', '트'],
      color: 0x00ff00,
      emoji: '🔄',
      enabled: true,
      threshold: 7
    };

    it('should update group successfully', async () => {
      mockConfigService.updateDetectionGroup.mockResolvedValue();

      const response = await request(app)
        .put('/api/config/groups/test-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Group updated successfully'
      });
      expect(mockConfigService.updateDetectionGroup).toHaveBeenCalledWith({
        ...updateData,
        id: 'test-id'
      });
    });

    it('should handle service errors during update', async () => {
      mockConfigService.updateDetectionGroup.mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/config/groups/test-id')
        .send(updateData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/config/groups/:id', () => {
    it('should delete group successfully', async () => {
      mockConfigService.deleteDetectionGroup.mockResolvedValue();

      const response = await request(app)
        .delete('/api/config/groups/test-id')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Group deleted successfully'
      });
      expect(mockConfigService.deleteDetectionGroup).toHaveBeenCalledWith('test-id');
    });

    it('should handle service errors during deletion', async () => {
      mockConfigService.deleteDetectionGroup.mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/config/groups/test-id')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/config/settings', () => {
    it('should return system settings', async () => {
      const mockConfig = {
        globalSettings: {
          countThreshold: 5,
          alertCooldown: 300000,
          countResetInterval: 60000
        }
      };
      mockConfigService.loadConfiguration.mockResolvedValue(mockConfig as any);

      const response = await request(app)
        .get('/api/config/settings')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockConfig.globalSettings
      });
    });
  });

  describe('PUT /api/config/settings/:key', () => {
    it('should update system setting', async () => {
      mockConfigService.updateSystemSetting.mockResolvedValue();

      const response = await request(app)
        .put('/api/config/settings/countThreshold')
        .send({ value: 10 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Setting updated successfully'
      });
      expect(mockConfigService.updateSystemSetting).toHaveBeenCalledWith('countThreshold', 10);
    });
  });

  describe('POST /api/config/reload', () => {
    it('should reload configuration successfully', async () => {
      mockMainApp.refreshConfiguration.mockResolvedValue();

      const response = await request(app)
        .post('/api/config/reload')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Configuration reloaded successfully'
      });
      expect(mockMainApp.refreshConfiguration).toHaveBeenCalledTimes(1);
    });

    it('should handle reload errors', async () => {
      mockMainApp.refreshConfiguration.mockRejectedValue(new Error('Reload failed'));

      const response = await request(app)
        .post('/api/config/reload')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/config/status', () => {
    it('should return system status', async () => {
      const mockConfig = {
        groups: [mockGroup, { ...mockGroup, id: 'test-2', enabled: false }],
        lastModified: new Date('2024-01-01')
      };
      mockConfigService.loadConfiguration.mockResolvedValue(mockConfig as any);

      const response = await request(app)
        .get('/api/config/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        totalGroups: 2,
        enabledGroups: 1,
        systemHealth: 'healthy'
      });
      expect(response.body.data.uptime).toBeGreaterThan(0);
    });
  });

  describe('GET /api/config/validation', () => {
    it('should validate configuration with valid config', async () => {
      const mockConfig = {
        groups: [mockGroup]
      };
      mockConfigService.loadConfiguration.mockResolvedValue(mockConfig as any);

      const response = await request(app)
        .get('/api/config/validation')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        valid: true,
        issues: []
      });
    });

    it('should detect configuration issues', async () => {
      const mockConfig = {
        groups: []
      };
      mockConfigService.loadConfiguration.mockResolvedValue(mockConfig as any);

      const response = await request(app)
        .get('/api/config/validation')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.valid).toBe(false);
      expect(response.body.issues).toContain('No detection groups configured');
    });
  });

  describe('GET /api/config/stats/groups', () => {
    it('should return group statistics', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue([mockGroup]);

      const response = await request(app)
        .get('/api/config/stats/groups')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([{
        name: mockGroup.name,
        displayName: mockGroup.display_name,
        enabled: mockGroup.enabled,
        threshold: mockGroup.threshold,
        characterCount: mockGroup.characters.length
      }]);
    });
  });

  describe('Dashboard route', () => {
    it('should serve dashboard HTML', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      // Response should be HTML
      expect(response.header['content-type']).toMatch(/html/);
    });
  });

  describe('Error handling middleware', () => {
    it('should handle unexpected errors', async () => {
      // Mock a route that throws an error
      mockConfigService.getDetectionGroups.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const response = await request(app)
        .get('/api/config/groups')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Failed to get groups'
      });
    });
  });

  describe('CORS middleware', () => {
    it('should include CORS headers', async () => {
      mockConfigService.getDetectionGroups.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/config/groups')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});