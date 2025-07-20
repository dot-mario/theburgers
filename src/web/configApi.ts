// src/web/configApi.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { SupabaseConfigurationService } from '../config/SupabaseConfigurationService';
import { DetectionGroup } from '../types/database';
import { Application } from '../application';

export class ConfigurationAPI {
  private app: express.Application;
  private configService: SupabaseConfigurationService;
  private mainApp: Application;
  private server: any;
  private wss: WebSocketServer | null = null;
  private connectedClients: Set<WebSocket> = new Set();

  constructor(configService: SupabaseConfigurationService, mainApp: Application) {
    this.app = express();
    this.configService = configService;
    this.mainApp = mainApp;
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));
    this.app.use(express.json());
    this.app.use(express.static('src/web/public'));

    // 로깅 미들웨어
    this.app.use((req, res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    // 에러 핸들링 미들웨어
    this.app.use((error: any, req: Request, res: Response, next: any) => {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  private setupRoutes(): void {
    const router = express.Router();

    // 그룹 관리 API
    router.get('/groups', this.getGroups.bind(this));
    router.post('/groups', this.createGroup.bind(this));
    router.put('/groups/:id', this.updateGroup.bind(this));
    router.delete('/groups/:id', this.deleteGroup.bind(this));

    // 시스템 설정 API
    router.get('/settings', this.getSettings.bind(this));
    router.put('/settings/:key', this.updateSetting.bind(this));

    // 시스템 제어 API
    router.post('/reload', this.reloadConfiguration.bind(this));
    router.get('/status', this.getSystemStatus.bind(this));
    router.get('/validation', this.validateConfiguration.bind(this));

    // 통계 및 모니터링 API
    router.get('/stats/counts', this.getCurrentCounts.bind(this));
    router.get('/stats/groups', this.getGroupStats.bind(this));

    this.app.use('/api/config', router);

    // 메인 대시보드 페이지
    this.app.get('/', (req, res) => {
      res.sendFile('dashboard.html', { root: 'src/web/public' });
    });
  }

  // 그룹 목록 조회
  private async getGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.configService.getDetectionGroups();
      res.json({ success: true, data: groups });
    } catch (error) {
      console.error('Failed to get groups:', error);
      res.status(500).json({ success: false, error: 'Failed to get groups' });
    }
  }

  // 그룹 생성
  private async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const groupData: Omit<DetectionGroup, 'id'> = req.body;
      
      // 입력 검증
      const validation = this.validateGroupData(groupData);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }

      const newGroup = await this.configService.createDetectionGroup(groupData);
      res.status(201).json({ success: true, data: newGroup });
    } catch (error) {
      console.error('Failed to create group:', error);
      res.status(500).json({ success: false, error: 'Failed to create group' });
    }
  }

  // 그룹 업데이트
  private async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: Partial<DetectionGroup> = req.body;
      
      // ID를 포함한 전체 그룹 데이터 구성
      const fullGroupData: DetectionGroup = { ...updateData, id } as DetectionGroup;
      
      const validation = this.validateGroupData(fullGroupData);
      if (!validation.valid) {
        res.status(400).json({ success: false, error: validation.error });
        return;
      }

      await this.configService.updateDetectionGroup(fullGroupData);
      res.json({ success: true, message: 'Group updated successfully' });
    } catch (error) {
      console.error('Failed to update group:', error);
      res.status(500).json({ success: false, error: 'Failed to update group' });
    }
  }

  // 그룹 삭제
  private async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.configService.deleteDetectionGroup(id);
      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Failed to delete group:', error);
      res.status(500).json({ success: false, error: 'Failed to delete group' });
    }
  }

  // 시스템 설정 조회
  private async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      res.json({ success: true, data: config.globalSettings });
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ success: false, error: 'Failed to get settings' });
    }
  }

  // 시스템 설정 업데이트
  private async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;

      await this.configService.updateSystemSetting(key, value);
      res.json({ success: true, message: 'Setting updated successfully' });
    } catch (error) {
      console.error('Failed to update setting:', error);
      res.status(500).json({ success: false, error: 'Failed to update setting' });
    }
  }

  // 설정 새로고침
  private async reloadConfiguration(req: Request, res: Response): Promise<void> {
    try {
      await this.mainApp.refreshConfiguration();
      res.json({ success: true, message: 'Configuration reloaded successfully' });
    } catch (error) {
      console.error('Failed to reload configuration:', error);
      res.status(500).json({ success: false, error: 'Failed to reload configuration' });
    }
  }

  // 시스템 상태 조회
  private async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      
      const status = {
        totalGroups: config.groups.length,
        enabledGroups: config.groups.filter(g => g.enabled).length,
        lastConfigUpdate: config.lastModified,
        systemHealth: 'healthy', // 실제로는 더 복잡한 헬스체크 로직
        uptime: process.uptime()
      };

      res.json({ success: true, data: status });
    } catch (error) {
      console.error('Failed to get system status:', error);
      res.status(500).json({ success: false, error: 'Failed to get system status' });
    }
  }

  // 설정 검증
  private async validateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const config = await this.configService.loadConfiguration();
      const validation = this.validateSystemConfiguration(config);
      
      res.json({ 
        success: true, 
        valid: validation.valid,
        issues: validation.issues || []
      });
    } catch (error) {
      console.error('Failed to validate configuration:', error);
      res.status(500).json({ success: false, error: 'Failed to validate configuration' });
    }
  }

  // 현재 카운트 상태 조회
  private async getCurrentCounts(req: Request, res: Response): Promise<void> {
    try {
      const countManager = this.mainApp.getCountManager();
      const counts = countManager ? countManager.getCurrentCounts() : {};
      res.json({ success: true, data: counts });
    } catch (error) {
      console.error('Failed to get current counts:', error);
      res.status(500).json({ success: false, error: 'Failed to get current counts' });
    }
  }

  // 그룹 통계 조회
  private async getGroupStats(req: Request, res: Response): Promise<void> {
    try {
      const groups = await this.configService.getDetectionGroups();
      const stats = groups.map(group => ({
        name: group.name,
        displayName: group.display_name,
        enabled: group.enabled,
        threshold: group.threshold,
        characterCount: group.characters.length
      }));

      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Failed to get group stats:', error);
      res.status(500).json({ success: false, error: 'Failed to get group stats' });
    }
  }

  // 그룹 데이터 검증
  private validateGroupData(group: Partial<DetectionGroup>): { valid: boolean; error?: string } {
    if (!group.name || group.name.trim() === '') {
      return { valid: false, error: 'Group name is required' };
    }

    if (!group.display_name || group.display_name.trim() === '') {
      return { valid: false, error: 'Display name is required' };
    }

    if (!group.characters || !Array.isArray(group.characters) || group.characters.length === 0) {
      return { valid: false, error: 'At least one character is required' };
    }

    if (!group.emoji || group.emoji.trim() === '') {
      return { valid: false, error: 'Emoji is required' };
    }

    if (typeof group.color !== 'number' || group.color < 0 || group.color > 0xFFFFFF) {
      return { valid: false, error: 'Valid color value is required' };
    }

    if (typeof group.threshold !== 'number' || group.threshold < 1 || group.threshold > 100) {
      return { valid: false, error: 'Threshold must be between 1 and 100' };
    }

    return { valid: true };
  }

  // 시스템 설정 검증
  private validateSystemConfiguration(config: any): { valid: boolean; issues?: string[] } {
    const issues: string[] = [];

    if (config.groups.length === 0) {
      issues.push('No detection groups configured');
    }

    const enabledGroups = config.groups.filter((g: DetectionGroup) => g.enabled);
    if (enabledGroups.length === 0) {
      issues.push('No enabled detection groups');
    }

    const duplicateNames = new Set();
    config.groups.forEach((group: DetectionGroup) => {
      if (duplicateNames.has(group.name)) {
        issues.push(`Duplicate group name: ${group.name}`);
      }
      duplicateNames.add(group.name);
    });

    return {
      valid: issues.length === 0,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  private setupWebSocket(): void {
    if (this.server) {
      this.wss = new WebSocketServer({ server: this.server, path: '/api/realtime/counts' });
      
      this.wss.on('connection', (ws: WebSocket) => {
        console.log('새로운 실시간 모니터링 클라이언트 연결됨');
        this.connectedClients.add(ws);
        
        // 연결 즉시 현재 카운트 전송
        this.sendCurrentCountsToClient(ws);
        
        // 연결 종료 시 클라이언트 제거
        ws.on('close', () => {
          console.log('실시간 모니터링 클라이언트 연결 해제됨');
          this.connectedClients.delete(ws);
        });
        
        // 에러 처리
        ws.on('error', (error) => {
          console.error('WebSocket 에러:', error);
          this.connectedClients.delete(ws);
        });
        
        // 클라이언트로부터 ping 메시지 처리
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
            }
          } catch (error) {
            console.error('WebSocket 메시지 파싱 에러:', error);
          }
        });
      });
    }
  }

  private async sendCurrentCountsToClient(ws: WebSocket): Promise<void> {
    try {
      const countManager = this.mainApp.getCountManager();
      if (countManager && ws.readyState === WebSocket.OPEN) {
        const counts = countManager.getCurrentCounts();
        const message = {
          type: 'counts_update',
          data: counts,
          timestamp: new Date().toISOString()
        };
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('카운트 데이터 전송 실패:', error);
    }
  }

  public broadcastCountUpdate(): void {
    if (this.connectedClients.size === 0) return;
    
    const countManager = this.mainApp.getCountManager();
    if (!countManager) return;
    
    const counts = countManager.getCurrentCounts();
    const message = {
      type: 'counts_update',
      data: counts,
      timestamp: new Date().toISOString()
    };
    
    const messageStr = JSON.stringify(message);
    
    // 모든 연결된 클라이언트에게 업데이트 전송
    this.connectedClients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      } else {
        // 연결이 끊어진 클라이언트 제거
        this.connectedClients.delete(ws);
      }
    });
    
    console.log(`${this.connectedClients.size}개 클라이언트에게 카운트 업데이트 전송됨`);
  }

  public listen(port: number): void {
    this.server = createServer(this.app);
    this.setupWebSocket();
    
    this.server.listen(port, () => {
      console.log(`Configuration API server running on port ${port}`);
      console.log(`Dashboard available at http://localhost:${port}`);
      console.log(`WebSocket endpoint available at ws://localhost:${port}/api/realtime/counts`);
    });
  }

  public getExpressApp(): express.Application {
    return this.app;
  }
}