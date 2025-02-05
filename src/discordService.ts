// src/discordService.ts
import { Client as DiscordClient, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';

export class DiscordService {
  private client: DiscordClient;

  constructor() {
    this.client = new DiscordClient({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
  }

  async login(): Promise<void> {
    await this.client.login(CONFIG.DISCORD_TOKEN);
    console.log(`Discord 봇이 ${this.client.user?.tag}로 로그인되었습니다.`);
  }

  async sendEmbed(embed: EmbedBuilder, channelId: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.error("Discord 채널을 찾지 못했거나 텍스트 채널이 아닙니다.");
        return;
      }
      await (channel as TextChannel).send({ embeds: [embed] });
      console.log("Discord 전송 (Embed):", embed.data);
    } catch (error) {
      console.error("Discord 전송 실패 (Embed):", error);
    }
  }

  async sendMessage(message: string, channelId: string): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.error("Discord 채널을 찾지 못했거나 텍스트 채널이 아닙니다.");
        return;
      }
      await (channel as TextChannel).send(message);
      console.log("Discord 전송 (Text):", message);
    } catch (error) {
      console.error("Discord 전송 실패 (Text):", error);
    }
  }
}
