import { ChzzkClient } from 'chzzk';
import { Client as DiscordClient, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
import { format } from 'date-fns';
import { readFileSync, watchFile } from 'fs';

// ====================================================
// 환경변수 로드 및 Discord 클라이언트 초기화
// ====================================================

dotenv.config();
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_ALERT_CHANNEL_ID = process.env.DISCORD_ALERT_CHANNEL_ID!;
const DISCORD_BAN_CHANNEL_ID = process.env.DISCORD_BAN_CHANNEL_ID!;
const NID_AUTH = process.env.NID_AUTH;
const NID_SESSION = process.env.NID_SESSION;

const STREAMER = "쟁구";
const COUNT = 10;

// 필수 환경변수 검증
if (!DISCORD_TOKEN || !DISCORD_ALERT_CHANNEL_ID || !DISCORD_BAN_CHANNEL_ID) {
  console.error("필수 환경변수가 누락되었습니다.");
  process.exit(1);
}

// Discord 클라이언트 생성 및 로그인 (Guilds, GuildMessages 인텐트 사용)
const discordClient = new DiscordClient({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});
discordClient.login(DISCORD_TOKEN);
discordClient.on('ready', () => {
  console.log(`Discord 봇이 ${discordClient.user?.tag}로 로그인되었습니다.`);
});

// ====================================================
// Discord 메시지 전송 헬퍼 함수
// ====================================================

async function sendDiscordEmbeds(embed: EmbedBuilder, channelId: string) {
  try {
    const channel = await discordClient.channels.fetch(channelId);
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

async function sendDiscordMessage(message: string, channelId: string) {
  try {
    const channel = await discordClient.channels.fetch(channelId);
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

// ====================================================
// 동적 설명 문구 로딩 (descriptions.json)
// ====================================================

interface DescriptionData {
  burger: string[];
  chicken: string[];
  pizza: string[];
  "!play": string[];
}

let descriptions: DescriptionData = {
  burger: [],
  chicken: [],
  pizza: [],
  "!play": []
};

function loadDescriptions() {
  try {
    const data = readFileSync('./descriptions.json', 'utf8');
    descriptions = JSON.parse(data);
    console.log('Descriptions loaded from file.');
  } catch (error) {
    console.error('Descriptions 로딩 실패. 기본 설명을 사용합니다.', error);
    descriptions = {
      burger: ["송재욱 버거 뿌린다 ㅋㅋ"],
      chicken: ["송재욱 치킨 뿌린다 ㅋㅋ"],
      pizza: ["송재욱 피자 뿌린다 ㅋㅋ"],
      "!play": ["송재욱 공 굴린다 ㅋㅋ"]
    };
  }
}
loadDescriptions();
watchFile('./descriptions.json', () => {
  console.log('descriptions.json 변경 감지. 재로딩합니다...');
  loadDescriptions();
});

/**
 * 그룹별 무작위 설명 문구 반환 함수
 * @param group - 'burger' | 'chicken' | 'pizza' | '!play'
 * @returns 무작위 선택된 문구
 */
function getRandomDescription(group: "burger" | "chicken" | "pizza" | "!play"): string {
  const groupDescriptions = descriptions[group];
  if (!groupDescriptions || groupDescriptions.length === 0) return "";
  const randomIndex = Math.floor(Math.random() * groupDescriptions.length);
  return groupDescriptions[randomIndex];
}

// ====================================================
// CHZZK 및 단어/문구 카운팅 관련 변수 및 함수
// ====================================================

// 타겟 채널 정보 (검색 후 설정)
let targetChannel: { channelId: string };

// 각 유저의 마지막 채팅 정보 저장 (닉네임 -> ChatInfo)
interface ChatInfo {
  message: string;
  time: Date;
}
const lastChatMap = new Map<string, ChatInfo>();

// 1분마다 lastChatMap에서 1시간 이상된 항목 제거 (메모리 누수 방지)
setInterval(() => {
  const now = Date.now();
  for (const [nickname, chatInfo] of lastChatMap.entries()) {
    if (now - chatInfo.time.getTime() > 1000 * 60 * 60) {
      lastChatMap.delete(nickname);
      console.log(`Removed outdated chat info for ${nickname}`);
    }
  }
}, 60 * 1000);

// 그룹별 단어 카운트 (예: burger 그룹: '젖', '버', '거')
const groupCounts: {
  burger: { '젖': number, '버': number, '거': number },
  chicken: { '젖': number, '치': number, '킨': number },
  pizza: { '젖': number, '피': number, '자': number }
} = {
  burger: { '젖': 0, '버': 0, '거': 0 },
  chicken: { '젖': 0, '치': 0, '킨': 0 },
  pizza: { '젖': 0, '피': 0, '자': 0 }
};

// !play 메시지 카운터
let playCount = 0;

// 그룹별/!play 카운트 초기화 함수
function resetGroupCounts(group: keyof typeof groupCounts) {
  for (const letter in groupCounts[group]) {
    groupCounts[group][letter as keyof typeof groupCounts[typeof group]] = 0;
  }
}
function resetPlayCount() {
  playCount = 0;
}

/**
 * 그룹별 카운트가 임계값(COUNT) 이상이면 Discord 알림 전송 후 카운트 초기화
 * @param group - 'burger' | 'chicken' | 'pizza'
 */
function checkGroupCountsForGroup(group: keyof typeof groupCounts) {
  const counts = groupCounts[group];
  const allSatisfied = Object.values(counts).every(val => val >= COUNT);
  if (allSatisfied) {
    const embed = new EmbedBuilder();
    switch (group) {
      case 'burger':
        embed.setColor(0xd4b799)
             .setTitle("🍔 젖버거 알림 🍔")
             .setDescription(getRandomDescription("burger"))
             .setURL("https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369");
        break;
      case 'chicken':
        embed.setColor(0xffa500)
             .setTitle("🍗 젖치킨 알림 🍗")
             .setDescription(getRandomDescription("chicken"))
             .setURL("https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369");
        break;
      case 'pizza':
        embed.setColor(0xff0000)
             .setTitle("🍕 젖피자 알림 🍕")
             .setDescription(getRandomDescription("pizza"))
             .setURL("https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369");
        break;
    }
    sendDiscordEmbeds(embed, DISCORD_ALERT_CHANNEL_ID);
    resetGroupCounts(group);
  }
}

/**
 * !play 메시지 카운트가 임계값 이상이면 Discord 알림 전송 후 카운트 초기화
 */
function checkPlayCount() {
  if (playCount >= COUNT) {
    const playEmbed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle("⚽ !play 알림 ⚽")
      .setDescription(getRandomDescription("!play"))
      .setURL("https://chzzk.naver.com/live/9107ff73efea18b598b9bd88ddfae369");
    sendDiscordEmbeds(playEmbed, DISCORD_ALERT_CHANNEL_ID);
    resetPlayCount();
  }
}

// 1분마다 그룹별 및 !play 카운트 초기화 (누적 카운트 리셋)
setInterval(() => {
  resetGroupCounts('burger');
  resetGroupCounts('chicken');
  resetGroupCounts('pizza');
  resetPlayCount();
}, 60 * 1000);

// ====================================================
// 시스템 메시지 관련 헬퍼 함수 (닉네임 추출 및 Discord 전송)
// ====================================================

/**
 * 시스템 메시지에서 고정 접미사를 제거하고 닉네임 추출
 * @param description - 전체 시스템 메시지
 * @param fixedSuffix - 메시지의 고정 접미사
 * @returns 추출된 닉네임 (없으면 빈 문자열)
 */
function extractAffectedUserNickname(description: string, fixedSuffix: string): string {
  const prefix = "님이 ";
  const nicknamePart = description.slice(0, -fixedSuffix.length);
  const prefixIndex = nicknamePart.indexOf(prefix);
  if (prefixIndex === -1) {
    console.warn("메시지에서 닉네임 시작 부분을 찾지 못했습니다:", description);
    return "";
  }
  return nicknamePart.slice(prefixIndex + prefix.length).trim();
}

/**
 * 시스템 메시지를 처리하여 Discord에 전송
 * @param description - 시스템 메시지 내용
 * @param type - 처리 타입: 'ban' (활동 제한), 'tempBan' (임시 제한), 'release' (활동 제한 해제)
 */
function handleSystemMessage(description: string, type: 'ban' | 'tempBan' | 'release') {
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
  const affectedUserNickname = extractAffectedUserNickname(description, fixedSuffix);
  if (!affectedUserNickname) return;
  const now = new Date();
  const formatted = format(now, "yyyy-MM-dd HH:mm:ss");
  const lastChat = lastChatMap.get(affectedUserNickname);
  const chatMsg = lastChat ? lastChat.message : defaultMsg;
  sendDiscordMessage(
    `\`\`\`[${formatted}] ${discordLabel} <${affectedUserNickname}> : ${chatMsg}\`\`\``,
    DISCORD_BAN_CHANNEL_ID
  );
}

// ====================================================
// CHZZK 클라이언트 및 이벤트 핸들러 설정
// ====================================================

const chzzkOptions = { nidAuth: NID_AUTH, nidSession: NID_SESSION };
const chzzkClient = new ChzzkClient(chzzkOptions);

/**
 * 메인 함수
 * - CHZZK 채널 검색 후 채팅 서버 연결
 * - 각종 이벤트 핸들러 등록
 */
async function main() {
  const result = await chzzkClient.search.channels(STREAMER);
  if (!result.channels || result.channels.length === 0) {
    console.error("검색 결과에 채널이 없습니다.");
    return;
  }
  targetChannel = result.channels[0];
  console.log("타겟 채널:", targetChannel.channelId);

  const chzzkChat = chzzkClient.chat({
    channelId: targetChannel.channelId,
    pollInterval: 30 * 1000
  });

  let isChzzkConnected = false;

  // 채팅 서버 연결 이벤트 처리
  chzzkChat.on('connect', () => {
    isChzzkConnected = true;
    console.log("채팅 서버에 연결되었습니다.");
    // 필요시 최근 채팅 요청: chzzkChat.requestRecentChat(50);
  });
  chzzkChat.on('disconnect', (data: string) => {
    isChzzkConnected = false;
    console.warn("채팅 서버 연결 끊김:", data);
  });
  chzzkChat.on('reconnect', (newChatChannelId: string) => {
    isChzzkConnected = true;
    console.log(`재연결됨. 새로운 chatChannelId: ${newChatChannelId}`);
  });

  // 채팅 메시지 이벤트 처리
  chzzkChat.on('chat', chat => {
    const message = chat.hidden ? "[블라인드 처리 됨]" : chat.message;
    console.log(`${chat.profile.nickname}: ${message}`);
    if (!chat.hidden) {
      lastChatMap.set(chat.profile.nickname, { message, time: new Date() });
    }

    // 각 그룹별 단어 카운트 업데이트
    for (const groupKey in groupCounts) {
      const group = groupKey as keyof typeof groupCounts;
      for (const letter in groupCounts[group]) {
        if (message === letter) {
          groupCounts[group][letter as keyof typeof groupCounts[typeof group]] += 1;
        }
      }
      checkGroupCountsForGroup(group);
    }

    // !play 메시지 카운트 업데이트
    if (message === "!play") {
      playCount += 1;
      checkPlayCount();
    }
  });

  // 시스템 메시지 이벤트 처리 (ban, 임시 제한, 석방)
  chzzkChat.on('systemMessage', systemMessage => {
    const description = systemMessage.extras.description;
    console.log("시스템 메시지:", description);
    if (description.endsWith("활동 제한 처리했습니다.")) {
      handleSystemMessage(description, 'ban');
    } else if (description.endsWith("임시 제한 처리했습니다.")) {
      handleSystemMessage(description, 'tempBan');
    } else if (description.endsWith("활동 제한을 해제했습니다.")) {
      handleSystemMessage(description, 'release');
    }
  });

  // 공지 메시지 이벤트 처리 (필요시 추가 로직 구현)
  chzzkChat.on('notice', notice => {
    console.log("공지 이벤트:", notice);
    // 예: sendDiscordMessage(`공지: ${notice.message}`, DISCORD_ALERT_CHANNEL_ID);
  });

  // 블라인드 처리된 메시지 이벤트
  chzzkChat.on('blind', blind => {
    if (blind.blindType === 'CBOTBLIND') return;
    console.log("블라인드 처리된 메시지:", blind);
  });

  // 원본 데이터 수신 (디버그용)
  chzzkChat.on('raw', rawData => {
    // 디버깅 시 사용: console.debug("Raw 데이터:", rawData);
  });

  // 연결 상태 주기 점검 및 재연결 시도 (5초마다)
  setInterval(() => {
    if (!isChzzkConnected) {
      console.warn("채팅 서버 연결 끊김. 재연결 시도 중...");
      chzzkChat.connect().catch(error => {
        console.error("재연결 시도 중 에러 발생:", error);
      });
    }
  }, 5 * 1000);

  await chzzkChat.connect();
}

main().catch(console.error);
