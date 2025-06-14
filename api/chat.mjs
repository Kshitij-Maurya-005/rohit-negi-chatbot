import fs from 'fs';
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 🧠 Limited history setup
let history = [];
let historyEnabled = true;
const HISTORY_LIMIT = 10; // 5 user + 5 bot turns

export function setHistoryEnabled(value) {
  historyEnabled = value;
  if (!value) history = [];
}

// ✅ Logging setup
const LOG_FILE = './chatlog.txt';
fs.writeFileSync(LOG_FILE, `=== New Chat Session: ${new Date().toLocaleString()} ===\n`, { flag: 'w' });

function logChat(role, message) {
  const time = new Date().toLocaleString();
  fs.appendFile(LOG_FILE, `[${time}] ${role.toUpperCase()}: ${message}\n`, (err) => {
    if (err) console.error("❌ Chat log error:", err);
  });
}

// 🧠 Gemini prompt
const systemPrompt = `
You are Rohit Negi, a confident and energetic Indian CSE teacher from India. You teach OS, DBMS, CN, DSA using simple, relatable examples and everyday analogies.

Speak in **Hinglish** — a natural mix of Hindi and English like Indian engineering students talk. Do NOT speak in full English. Use familiar desi terms like “bhai”, “chamka kya?”, “chamka?”, “kiliear hai?”, “jugaad”, “mast” — but use them naturally and only where they make sense.

Avoid overacting, loud greetings, or YouTuber-style intros. Speak casually, like a cool teacher who students vibe with.

If someone asks about DSA, Web Dev, Blockchain, or System Design, tell them that helpful resources are available — just say “Check out the resources below 👇”. Don’t add or fake links in your answer. Links will be added later.

Use emojis only if they actually help the explanation or add tone.

Don’t talk about gym or your personal life unless the user asks you directly.

Responses should be short, natural, chill, and funny when needed — just like a confident Indian teacher would speak in class or on YouTube.
`;

export async function handleChatRequest(query) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  logChat("user", query);

  if (!historyEnabled) history = [];

  history.push({
    role: "user",
    parts: [{ text: query }],
  });

  let reply = "";

  try {
    const result = await model.generateContent({
      contents: history,
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }],
      },
    });

    reply = result.response.text();

    history.push({
      role: "model",
      parts: [{ text: reply }],
    });

    // 🧠 Limit history to last 10 entries
    if (history.length > HISTORY_LIMIT) {
      history = history.slice(-HISTORY_LIMIT);
    }

    logChat("bot", reply);
  } catch (err) {
    console.error("Gemini Error:", err);
    reply = "Rohit Bhaiya gym me hai 😅 — try again later.";
    logChat("bot", reply);
  }

  // 📚 Smart link suggestions
  const q = query.toLowerCase();
  if (q.includes("dsa")) {
    reply += `<br><br>👇 Check these out:<br>
📺 <a href="https://youtube.com/playlist?list=PLQEaRBV9gAFu4ovJ41PywklqI7IyXwr01" target="_blank">DSA Playlist</a><br>
🎓 <a href="https://rohittnegi.akamai.net.in/new-courses/5-data-structure-and-algorithm-course" target="_blank">DSA Course</a>`;
  } else if (q.includes("web")) {
    reply += `<br><br>👇 Check these out:<br>
📺 <a href="https://youtu.be/CcFIrllSy2o" target="_blank">Web Dev Roadmap</a><br>
🎓 <a href="https://rohittnegi.akamai.net.in/new-courses/4-web-development-block-chain-system-design-data-structure-and-algorithm" target="_blank">Web Dev Course</a>`;
  } else if (q.includes("blockchain")) {
    reply += `<br><br>👇 Check these out:<br>
📺 <a href="https://youtu.be/yNyVboGmy3M" target="_blank">Blockchain Roadmap</a><br>
🎓 <a href="https://rohittnegi.akamai.net.in/new-courses/4-web-development-block-chain-system-design-data-structure-and-algorithm" target="_blank">Blockchain Course</a>`;
  } else if (q.includes("system design")) {
    reply += `<br><br>👇 Check these out:<br>
📺 <a href="https://youtu.be/mrHT4bIa308" target="_blank">System Design in 10 mins</a><br>
🎓 <a href="https://youtube.com/playlist?list=PLQEaRBV9gAFvzp6XhcNFpk1WdOcyVo9qT" target="_blank">System Design Course</a>`;
  }

  return reply;
}
