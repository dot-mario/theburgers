// src/chzzkService.ts
import { ChzzkClient } from 'chzzk';
import { CONFIG } from './config';
import { CountManager } from './countManager';
import { DiscordService } from './discordService';
import { CHAT_CLEANUP_INTERVAL, CONNECTION_CHECK_INTERVAL, CHAT_POLL_INTERVAL, OLD_CHAT_THRESHOLD } from './constants';
import { ChatInfo, CleanupableService } from './types';
import { BanUtils, DateUtils, IntervalManager } from './utils';
import { DynamicConstants } from './config/DynamicConstants';

export class ChzzkService implements CleanupableService {
  private targetChannel!: { channelId: string };
  private lastChatMap = new Map<string, ChatInfo>();
  private isChzzkConnected = false;
  private intervalManager = new IntervalManager();

  constructor(
    private readonly countManager: CountManager,
    private readonly discordService: DiscordService,
    private readonly dynamicConstants: DynamicConstants
  ) {
    this.intervalManager.createInterval(() => {
      this.cleanupOldChats();
    }, CHAT_CLEANUP_INTERVAL);
  }

  public async start(): Promise<void> {
    try {
      const chzzkClient = new ChzzkClient({
        nidAuth: CONFIG.NID_AUTH,
        nidSession: CONFIG.NID_SESSION,
      });
      const result = await chzzkClient.search.channels(CONFIG.STREAMER);
      if (!result.channels || result.channels.length === 0) {
        console.error("No channel found in search results.");
        return;
      }
      this.targetChannel = result.channels[0];
      console.log("Target channel:", this.targetChannel.channelId);

      const chzzkChat = chzzkClient.chat({
        channelId: this.targetChannel.channelId,
        pollInterval: CHAT_POLL_INTERVAL,
      });

      chzzkChat.on('connect', this.handleConnect.bind(this));
      chzzkChat.on('disconnect', this.handleDisconnect.bind(this));
      chzzkChat.on('reconnect', this.handleReconnect.bind(this));
      chzzkChat.on('chat', (chat) => this.handleChat(chat));
      chzzkChat.on('systemMessage', (systemMessage) => this.processSystemMessage(systemMessage));

      this.intervalManager.createInterval(() => {
        if (!this.isChzzkConnected) {
          console.warn("Chat server disconnected. Attempting reconnection...");
          chzzkChat.connect().catch(error => {
            console.error("Error during reconnection attempt:", error);
          });
        }
      }, CONNECTION_CHECK_INTERVAL);

      await chzzkChat.connect();
    } catch (error) {
      console.error("Failed to start ChzzkService:", error);
    }
  }

  private handleConnect(): void {
    this.isChzzkConnected = true;
    console.log("Connected to chat server.");
  }

  private handleDisconnect(data: string): void {
    this.isChzzkConnected = false;
    console.warn("Disconnected from chat server:", data);
  }

  private handleReconnect(newChatChannelId: string): void {
    this.isChzzkConnected = true;
    console.log(`Reconnected. New chat channel ID: ${newChatChannelId}`);
  }

  private handleChat(chat: any): void {
    const message = chat.hidden ? "[블라인드 처리 됨]" : chat.message;
    console.log(`${chat.profile.nickname}: ${message}`);
    if (!chat.hidden) {
      this.lastChatMap.set(chat.profile.nickname, { message, time: new Date() });
    }
    this.updateWordCounts(message);
  }

  private processSystemMessage(systemMessage: any): void {
    const description = systemMessage.extras.description;
    console.log("System message:", description);
    this.handleSystemMessage(description);
  }

  private async handleSystemMessage(description: string) {
    const banInfo = BanUtils.parseBanMessage(description);
    if (!banInfo) {
      console.warn("Failed to extract ban info from description:", description);
      return;
    }

    const lastChat = this.lastChatMap.get(banInfo.target);
    const defaultMessage = BanUtils.getDefaultMessage(banInfo.action);
    const chatMsg = lastChat ? lastChat.message : (defaultMessage || 'Unknown action');
    const timestamp = DateUtils.formatDateTime(new Date());
    
    const message = BanUtils.formatBanMessage(banInfo, chatMsg, CONFIG.STREAMER, timestamp);
    if (message) {
      await this.discordService.sendMessage(message, CONFIG.DISCORD_BAN_CHANNEL_ID);
    }
  }
  
  private async updateWordCounts(message: string): Promise<void> {
    try {
      const groupCharacters = await this.dynamicConstants.getGroupCharacters();
      
      // 각 그룹의 문자들을 확인
      for (const [group, characters] of Object.entries(groupCharacters)) {
        for (const letter of characters) {
          if (message === letter) {
            await this.countManager.updateGroupCount(group, letter);
          }
        }
      }
    } catch (error) {
      console.error('Failed to update word counts:', error);
      // 설정 로딩 실패 시에도 서비스는 계속 동작하도록 함
    }
  }

  private cleanupOldChats(): void {
    const now = Date.now();
    for (const [nickname, chatInfo] of this.lastChatMap.entries()) {
      if (now - chatInfo.time.getTime() > OLD_CHAT_THRESHOLD) {
        this.lastChatMap.delete(nickname);
        console.log(`Removed outdated chat info for ${nickname}`);
      }
    }
  }

  // 현재 연결 상태 조회
  public isConnected(): boolean {
    return this.isChzzkConnected;
  }

  // 최근 채팅 정보 조회
  public getRecentChats(): Map<string, ChatInfo> {
    return new Map(this.lastChatMap);
  }

  public cleanup(): void {
    this.intervalManager.clearAllIntervals();
  }
}