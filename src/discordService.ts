// src/discordService.ts
import { Client as DiscordClient, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import { CONFIG } from './config';
import { CleanupableService } from './types';

export class DiscordService implements CleanupableService {
  private client: DiscordClient;

  constructor() {
    this.client = new DiscordClient({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });
  }

  async login(): Promise<void> {
    try {
      await this.client.login(CONFIG.DISCORD_TOKEN);
      console.log(`Logged in as ${this.client.user?.tag}.`);
    } catch (error) {
      console.error("Discord login failed:", error);
      throw error;
    }
  }

  private async getTextChannel(channelId: string): Promise<TextChannel | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        console.error("Channel not found or not text-based:", channelId);
        return null;
      }
      return channel as TextChannel;
    } catch (error) {
      console.error("Error fetching channel:", error);
      return null;
    }
  }

  async sendEmbed(embed: EmbedBuilder, channelId: string): Promise<void> {
    const channel = await this.getTextChannel(channelId);
    if (!channel) return;
    try {
      await channel.send({ embeds: [embed] });
      console.log("Embed sent:", embed.data);
    } catch (error) {
      console.error("Failed to send embed:", error);
    }
  }

  async sendMessage(message: string, channelId: string): Promise<void> {
    const channel = await this.getTextChannel(channelId);
    if (!channel) return;
    try {
      await channel.send(message);
      console.log("Message sent:", message);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  }

  public cleanup(): void {
    if (this.client) {
      this.client.destroy();
    }
  }
}
