import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// AI reply
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const response = await axios.post(
    "https://api-inference.huggingface.co/models/Qwen/Qwen2-7B-Instruct",
    { inputs: text },
    { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
  );

  bot.sendMessage(chatId, response.data[0].generated_text);
});

// ====== keep alive server ======
const app = express();
app.get("/", (req, res) => res.send("Bot alive"));
app.listen(process.env.PORT || 3000);
