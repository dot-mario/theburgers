// src/chzzkService.ts
import { ChzzkClient } from 'chzzk';
import { CONFIG } from './config';
import { CountManager } from './countManager';
import { DiscordService } from './discordService';
import { format } from 'date-fns';
import { CHAT_CLEANUP_INTERVAL, CONNECTION_CHECK_INTERVAL, CHAT_POLL_INTERVAL } from './constants';

interface ChatInfo {
  message: string;
  time: Date;
}

export class ChzzkService {
  private targetChannel!: { channelId: string };
  private lastChatMap = new Map<string, ChatInfo>();
  private isChzzkConnected = false;
  
  private cleanupIntervalId: NodeJS.Timeout;
  private connectionCheckIntervalId!: NodeJS.Timeout;

  constructor(
    private readonly countManager: CountManager,
    private readonly discordService: DiscordService
  ) {
    this.cleanupIntervalId = setInterval(() => {
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

      this.connectionCheckIntervalId = setInterval(() => {
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
    // 그룹별 단어 카운트 업데이트 (CountManager의 getGroupLetters() 사용)
    for (const group of ['burger', 'chicken', 'pizza'] as const) {
      this.countManager.getGroupLetters(group).forEach(letter => {
        if (message === letter) {
          this.countManager.updateGroupCount(group, letter);
        }
      });
    }
  }

  private processSystemMessage(systemMessage: any): void {
    const description = systemMessage.extras.description;
    console.log("System message:", description);
    this.handleSystemMessage(description);
  }

  private async handleSystemMessage(description: string) {
    // 정규표현식을 사용해 "A님이 B님을 {액션}" 패턴에서 A(발신자)와 B(대상), 그리고 액션을 추출합니다.
    const regex = /^(?<issuer>.+?)님이\s+(?<target>.+?)님을\s+(?<action>활동 제한 처리했습니다|임시 제한 처리했습니다|활동 제한을 해제했습니다)/;
    const match = description.match(regex);
    if (!match || !match.groups) {
      console.warn("Failed to extract ban info from description:", description);
      return;
    }
  
    const issuer = match.groups.issuer.trim();
    const target = match.groups.target.trim();
    const action = match.groups.action.trim();
  
    let discordLabel: string;
    let defaultMsg: string;
    if (action === "활동 제한 처리했습니다") {
      discordLabel = "[밴]";
      defaultMsg = "뒷밴";
    } else if (action === "임시 제한 처리했습니다") {
      discordLabel = "[임차]";
      defaultMsg = "뒷임차";
    } else if (action === "활동 제한을 해제했습니다") {
      discordLabel = "[석방]";
      defaultMsg = "석방";
    } else {
      return;
    }
  
    // 만약 발신자(issuer)가 실제 streamer가 아니라면 밴한 주체로 간주합니다.
    const banInitiator = issuer !== CONFIG.STREAMER ? issuer : null;
  
    // 대상의 마지막 채팅 메시지를 가져옵니다.
    const lastChat = this.lastChatMap.get(target);
    const chatMsg = lastChat ? lastChat.message : defaultMsg;
    const now = new Date();
    const formatted = format(now, "yyyy-MM-dd HH:mm:ss");
  
    // 밴 메시지에 발신자가 실제 streamer가 아닌 경우 밴한 주체 정보를 함께 포함합니다.
    const message = banInitiator
      ? `\`\`\`[${formatted}] ${discordLabel} <${target}> (banned by <${banInitiator}>) : ${chatMsg}\`\`\``
      : `\`\`\`[${formatted}] ${discordLabel} <${target}> : ${chatMsg}\`\`\``;
  
    await this.discordService.sendMessage(message, CONFIG.DISCORD_BAN_CHANNEL_ID);
  }
  

  private cleanupOldChats(): void {
    const now = Date.now();
    for (const [nickname, chatInfo] of this.lastChatMap.entries()) {
      if (now - chatInfo.time.getTime() > 60 * 60 * 1000) { // 1시간
        this.lastChatMap.delete(nickname);
        console.log(`Removed outdated chat info for ${nickname}`);
      }
    }
  }

  public cleanup(): void {
    clearInterval(this.cleanupIntervalId);
    clearInterval(this.connectionCheckIntervalId);
  }
}
