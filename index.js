import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  bot.sendMessage(chatId, "🤖 thinking...");

  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
        },
      }
    );

    const reply = res.data[0].generated_text;
    bot.sendMessage(chatId, reply);
  } catch (e) {
    bot.sendMessage(chatId, "AI error ❌");
  }
});
