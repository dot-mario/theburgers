// src/chzzkService.ts
import { ChzzkClient } from 'chzzk';
import { CONFIG } from './config';
import { CountManager } from './countManager';
import { DiscordService } from './discordService';
import { format } from 'date-fns';

interface ChatInfo {
  message: string;
  time: Date;
}

export class ChzzkService {
  private targetChannel!: { channelId: string };
  private lastChatMap = new Map<string, ChatInfo>();
  private isChzzkConnected = false;
  
  // 타이머 ID를 저장합니다.
  private cleanupIntervalId: NodeJS.Timeout;
  private connectionCheckIntervalId!: NodeJS.Timeout;

  constructor(
    private readonly countManager: CountManager,
    private readonly discordService: DiscordService
  ) {
    // 1분마다 lastChatMap에서 1시간 지난 항목 제거
    this.cleanupIntervalId = setInterval(() => {
      const now = Date.now();
      for (const [nickname, chatInfo] of this.lastChatMap.entries()) {
        if (now - chatInfo.time.getTime() > 1000 * 60 * 60) {
          this.lastChatMap.delete(nickname);
          console.log(`Removed outdated chat info for ${nickname}`);
        }
      }
    }, 60 * 1000);
  }

  public async start(): Promise<void> {
    const chzzkClient = new ChzzkClient({
      nidAuth: CONFIG.NID_AUTH,
      nidSession: CONFIG.NID_SESSION,
    });
    const result = await chzzkClient.search.channels(CONFIG.STREAMER);
    if (!result.channels || result.channels.length === 0) {
      console.error("검색 결과에 채널이 없습니다.");
      return;
    }
    this.targetChannel = result.channels[0];
    console.log("타겟 채널:", this.targetChannel.channelId);

    const chzzkChat = chzzkClient.chat({
      channelId: this.targetChannel.channelId,
      pollInterval: 30 * 1000,
    });

    chzzkChat.on('connect', () => {
      this.isChzzkConnected = true;
      console.log("채팅 서버에 연결되었습니다.");
    });

    chzzkChat.on('disconnect', (data: string) => {
      this.isChzzkConnected = false;
      console.warn("채팅 서버 연결 끊김:", data);
    });

    chzzkChat.on('reconnect', (newChatChannelId: string) => {
      this.isChzzkConnected = true;
      console.log(`재연결됨. 새로운 chatChannelId: ${newChatChannelId}`);
    });

    chzzkChat.on('chat', chat => {
      const message = chat.hidden ? "[블라인드 처리 됨]" : chat.message;
      console.log(`${chat.profile.nickname}: ${message}`);
      if (!chat.hidden) {
        this.lastChatMap.set(chat.profile.nickname, { message, time: new Date() });
      }
      // 그룹별 단어 카운트 업데이트
      for (const group of ['burger', 'chicken', 'pizza'] as const) {
        Object.keys(this.countManager['groupCounts']?.[group] || {}).forEach(letter => {
          if (message === letter) {
            this.countManager.updateGroupCount(group, letter);
          }
        });
      }
      // !play 메시지 업데이트
      if (message === "!play") {
        this.countManager.updatePlayCount();
      }
    });

    chzzkChat.on('systemMessage', systemMessage => {
      const description = systemMessage.extras.description;
      console.log("시스템 메시지:", description);
      if (description.endsWith("활동 제한 처리했습니다.")) {
        this.handleSystemMessage(description, 'ban');
      } else if (description.endsWith("임시 제한 처리했습니다.")) {
        this.handleSystemMessage(description, 'tempBan');
      } else if (description.endsWith("활동 제한을 해제했습니다.")) {
        this.handleSystemMessage(description, 'release');
      }
    });

    // 5초마다 연결 상태 확인 타이머 설정
    this.connectionCheckIntervalId = setInterval(() => {
      if (!this.isChzzkConnected) {
        console.warn("채팅 서버 연결 끊김. 재연결 시도 중...");
        chzzkChat.connect().catch(error => {
          console.error("재연결 시도 중 에러 발생:", error);
        });
      }
    }, 5 * 1000);

    await chzzkChat.connect();
  }

  private async handleSystemMessage(description: string, type: 'ban' | 'tempBan' | 'release') {
    let fixedSuffix: string;
    let discordLabel: string;
    let defaultMsg: string;
    switch (type) {
      case 'ban':
        fixedSuffix = "님을 활동 제한 처리했습니다.";
        discordLabel = "[밴]";
        defaultMsg = "뒷밴";
        break;
      case 'tempBan':
        fixedSuffix = "님을 임시 제한 처리했습니다.";
        discordLabel = "[임차]";
        defaultMsg = "뒷임차";
        break;
      case 'release':
        fixedSuffix = "님의 활동 제한을 해제했습니다.";
        discordLabel = "[석방]";
        defaultMsg = "석방";
        break;
    }
    if (!description.endsWith(fixedSuffix)) return;
    const affectedUserNickname = this.extractAffectedUserNickname(description, fixedSuffix);
    if (!affectedUserNickname) return;
    const now = new Date();
    const formatted = format(now, "yyyy-MM-dd HH:mm:ss");
    const lastChat = this.lastChatMap.get(affectedUserNickname);
    const chatMsg = lastChat ? lastChat.message : defaultMsg;
    await this.discordService.sendMessage(
      `\`\`\`[${formatted}] ${discordLabel} <${affectedUserNickname}> : ${chatMsg}\`\`\``,
      CONFIG.DISCORD_BAN_CHANNEL_ID
    );
  }

  private extractAffectedUserNickname(description: string, fixedSuffix: string): string {
    const prefix = "님이 ";
    const nicknamePart = description.slice(0, -fixedSuffix.length);
    const prefixIndex = nicknamePart.indexOf(prefix);
    if (prefixIndex === -1) {
      console.warn("메시지에서 닉네임 시작 부분을 찾지 못했습니다:", description);
      return "";
    }
    return nicknamePart.slice(prefixIndex + prefix.length).trim();
  }

  // cleanup 메서드: 생성된 타이머를 모두 해제합니다.
  public cleanup(): void {
    clearInterval(this.cleanupIntervalId);
    clearInterval(this.connectionCheckIntervalId);
  }
}
