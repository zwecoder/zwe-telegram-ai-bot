import { Telegraf } from "telegraf";
import fetch from "node-fetch"; // Node 18+ built-in fetch ကိုသုံးလည်းရပါတယ်

// ===== Read tokens from environment variables =====
const API_KEY = process.env.GROQ_API_KEY;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = "https://api.groq.com/openai/v1";

// ===== Bot setup =====
const bot = new Telegraf(BOT_TOKEN);

// ===== User conversation memory =====
const userConversations = {};

// ===== Helpers =====
async function askGroqAI(userId, message) {
  const history = userConversations[userId] || [];
  history.push({ role: "user", content: message });

  const res = await fetch(`${BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      input: history.map((m) => `${m.role}: ${m.content}`).join("\n"),
    }),
  });

  const data = await res.json();
  let aiText = "No reply found";

  if (data.output && Array.isArray(data.output)) {
    const messageBlock = data.output.find((o) => o.type === "message");
    if (messageBlock && messageBlock.content && Array.isArray(messageBlock.content)) {
      const textObj = messageBlock.content[0];
      if (textObj.text) aiText = textObj.text;
    }
  }

  history.push({ role: "assistant", content: aiText });
  userConversations[userId] = history;
  return aiText;
}

// ===== Bot commands =====
bot.start((ctx) => ctx.reply("Hi! This is a multi-turn AI bot.\nSend me any message."));
bot.command("clear", (ctx) => {
  userConversations[ctx.from.id] = [];
  ctx.reply("✅ Your conversation history has been cleared.");
});
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from.id;
  await ctx.sendChatAction("typing");
  const aiReply = await askGroqAI(userId, userMessage);
  ctx.reply(aiReply);
});

bot.launch();
console.log("✅ Telegram multi-turn Groq AI bot running...");
