// src/webServer.ts
import { Application } from './application';
import { ConfigurationAPI } from './web/configApi';

export class WebServer {
  private app: Application;
  private configAPI: ConfigurationAPI;
  private port: number;

  constructor(app: Application, port: number = 3000) {
    this.app = app;
    this.port = port;
    this.configAPI = new ConfigurationAPI(
      app.getConfigurationService(),
      app
    );
  }

  start(): void {
    // CountManager와 실시간 업데이트 연결
    const countManager = this.app.getCountManager();
    if (countManager) {
      countManager.setRealtimeUpdateCallback(() => {
        this.configAPI.broadcastCountUpdate();
      });
    }
    
    this.configAPI.listen(this.port);
  }

  stop(): void {
    // Express 서버 종료 로직이 필요하면 여기에 추가
  }
}