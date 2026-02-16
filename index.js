const { Telegraf } = require("telegraf");
const fetch = require("node-fetch");

// ===== Read tokens from environment variables =====
const API_KEY = process.env.GROQ_API_KEY;         // Groq API key
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN; // Telegram Bot token
const BASE_URL = "https://api.groq.com/openai/v1";

// ===== Bot setup =====
const bot = new Telegraf(BOT_TOKEN);

// ===== User conversation memory =====
const userConversations = {}; // key: user id, value: array of messages

// ===== Helpers =====
async function askGroqAI(userId, message) {
  const history = userConversations[userId] || [];
  history.push({ role: "user", content: message });

  try {
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
  } catch (err) {
    console.error("Error contacting AI:", err.message);
    return "Error contacting AI: " + err.message;
  }
}

// ===== Bot commands =====
bot.start((ctx) => {
  ctx.reply(
    "Hi! This is a multi-turn AI bot.\nSend me any message, and I'll reply intelligently."
  );
});

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
