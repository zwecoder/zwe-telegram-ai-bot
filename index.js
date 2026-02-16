console.log("HF:", process.env.OPENAI_API_KEY);
console.log("TG:", process.env.TELEGRAM_TOKEN);
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    const res = await axios.post(
      "https://api.groq.com/openai/v1",
      {
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: text }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices[0].message.content;
    await bot.sendMessage(chatId, reply);

  } catch (err) {
    console.log(err.response?.data || err.message);
    bot.sendMessage(msg.chat.id, "AI error");
  }
});

const app = express();
app.get("/", (req, res) => res.send("Bot alive"));
app.listen(process.env.PORT || 3000);

