const inputEl = document.getElementById("userInput");
const sendBtn = document.getElementById("sendButton");
const micBtn = document.getElementById("micBtn");
const messages = document.getElementById("chatMessages");
const voiceToggle = document.getElementById("voiceToggle");

sendBtn.onclick = handleSend;
micBtn.onclick = startListening;

inputEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

voiceToggle.addEventListener("change", (e) => {
  const label = e.target.checked ? "🔊 Voice On" : "🔇 Voice Off";
  e.target.nextSibling.textContent = label;
});

function appendMessage(text, sender, isHTML = false) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  if (isHTML) {
    div.innerHTML = text;
  } else {
    div.innerText = text;
  }
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

async function handleSend() {
  const userText = inputEl.value.trim();
  if (!userText) return;

  appendMessage(userText, "user");
  inputEl.value = "";

  // 👇 Show typing dots bubble
  const typingEl = document.createElement("div");
  typingEl.className = "message bot typing";
  typingEl.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;
  messages.appendChild(typingEl);
  messages.scrollTop = messages.scrollHeight;

  // 👇 Send message to backend
  const res = await fetch("https://rohit-negi-chatbot-lsor.onrender.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: userText }),
  });

  const data = await res.json();

  // 👇 Remove typing bubble
  typingEl.remove();

  // 👇 Format markdown links to HTML <a>
  const formattedText = data.reply.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');

  appendMessage(formattedText, "bot", true);
  speak(data.reply);
}

function speak(text) {
  const isVoiceEnabled = voiceToggle.checked;
  if (!isVoiceEnabled) return;

  // 🔥 Clean out links, emojis, and HTML tags
  const cleanText = text
    .replace(/<a [^>]+>(.*?)<\/a>/gi, '$1') // Keep only anchor text, remove <a href=...>
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')   // Remove markdown links
    .replace(/<br\s*\/?>/gi, '\n')          // Replace <br> with line break
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') // Remove emojis
    .replace(/&nbsp;/g, ' ')                // Remove non-breaking spaces (optional)
    .trim();

  const utt = new SpeechSynthesisUtterance(cleanText);
  utt.lang = "en-IN";
  utt.pitch = 1.0;
  utt.rate = 1.3;
  speechSynthesis.speak(utt);
}


function startListening() {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.lang = "en-IN";
  rec.start();
  rec.onresult = (e) => {
    inputEl.value = e.results[0][0].transcript;
    handleSend();
  };
}
