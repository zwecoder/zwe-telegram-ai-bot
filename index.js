import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// message handler
bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    const res = await axios.post(
      "https://router.huggingface.co/hf-inference/models/Qwen/Qwen2-7B-Instruct",
      {
        inputs: text,
        parameters: { max_new_tokens: 200 }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.generated_text || "No response";
    await bot.sendMessage(chatId, reply);

  } catch (err) {
    console.log("AI ERROR:", err.response?.data || err.message);
    bot.sendMessage(msg.chat.id, "AI error 😢");
  }
});

// keep alive server
const app = express();
app.get("/", (req, res) => res.send("Bot alive"));
app.listen(process.env.PORT || 3000);
