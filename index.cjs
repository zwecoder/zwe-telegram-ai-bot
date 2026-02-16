// const fs = require('fs');
// console.log(".env exists:", fs.existsSync('./.env'));
// require('dotenv').config();
const { Telegraf } = require("telegraf");
const fetch = require("node-fetch"); // Node < 18 only

// Read from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_KEY = process.env.GROQ_API_KEY;
const BASE_URL = "https://api.groq.com/openai/v1";
console.log("BOT TOKEN:", BOT_TOKEN ? "✅ Loaded" : "❌ Missing");
console.log("GROQ KEY:", API_KEY ? "✅ Loaded" : "❌ Missing");

const bot = new Telegraf(BOT_TOKEN);

// rest of your bot code ...


const userConversations = {};

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

bot.start((ctx) => ctx.reply("Hi! This is a multi-turn AI bot."));
bot.command("clear", (ctx) => {
  userConversations[ctx.from.id] = [];
  ctx.reply("✅ Conversation cleared.");
});
bot.on("text", async (ctx) => {
  const userMessage = ctx.message.text;
  const userId = ctx.from.id;

  await ctx.sendChatAction("typing");
  const aiReply = await askGroqAI(userId, userMessage);
  ctx.reply(aiReply);
});

bot.launch();
console.log("✅ Bot running...");
