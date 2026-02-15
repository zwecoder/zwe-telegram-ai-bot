import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const token = process.env.BOT_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN;

const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;

  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct",
      {
        inputs: msg.text
      },
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`
        }
      }
    );

    const reply = res.data[0]?.generated_text || "No response";
    bot.sendMessage(chatId, reply);

  } catch (e) {
    bot.sendMessage(chatId, "AI error 😢");
  }
});
