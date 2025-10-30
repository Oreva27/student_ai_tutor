document.addEventListener("DOMContentLoaded", async () => {
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message");
  const sendBtn = document.getElementById("send-btn");
  const resetBtn = document.getElementById("reset-btn");
  const historyPanel = document.getElementById("history-panel");
  const toggleHistoryBtn = document.getElementById("toggle-history-btn");

  const CHAT_SESSIONS_KEY = "sciSparkChatSessions";
  let sessions = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY)) || {};
  let currentSessionId = generateSessionId();

  // Initialize session
  if (!sessions[currentSessionId]) {
    sessions[currentSessionId] = [];
    showWelcomeMessage(); // 🟢 Auto message for first session
  }

  renderHistoryPanel();
  renderChat(currentSessionId);

  // === Generate unique session ID ===
  function generateSessionId() {
    return "session_" + Date.now();
  }

  // === Render messages for a given session ===
  function renderChat(sessionId) {
    chatBox.innerHTML = "";
    const chatHistory = sessions[sessionId] || [];
    chatHistory.forEach(msg => addMessage(msg.sender, msg.text));
  }

  // === Render message bubble ===
  function addMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.textContent = text;

    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);

    msgDiv.addEventListener("mouseenter", () => {
      msgDiv.style.transform = "scale(1.02)";
      msgDiv.style.transition = "transform 0.2s ease";
    });
    msgDiv.addEventListener("mouseleave", () => {
      msgDiv.style.transform = "scale(1)";
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // === Save message to current session ===
  function saveMessage(sender, text) {
    if (!sessions[currentSessionId]) sessions[currentSessionId] = [];
    sessions[currentSessionId].push({ sender, text });
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    renderHistoryPanel(); // update sidebar live
  }

  // === Render chat history sidebar on the left ===
  function renderHistoryPanel() {
    if (!historyPanel) return;
    historyPanel.innerHTML = "";
    historyPanel.style.display = "flex";
    historyPanel.style.flexDirection = "column";
    historyPanel.style.width = "220px"; // fixed width for sidebar
    historyPanel.style.overflowY = "auto";
    historyPanel.style.padding = "10px";
    historyPanel.style.borderRight = "1px solid #2b2f44";

    const sessionIds = Object.keys(sessions);
    if (sessionIds.length === 0) {
      historyPanel.innerHTML = "<p class='empty'>No previous chats</p>";
      return;
    }

    sessionIds.forEach((id, index) => {
      const btn = document.createElement("button");
      btn.classList.add("history-item");
const firstMsg = sessions[id].find(msg => msg.sender === "user");
btn.textContent = firstMsg ? firstMsg.text : "New Chat";
      btn.onclick = () => {
        currentSessionId = id;
        renderChat(id);
        highlightActiveSession(id);
      };
      historyPanel.appendChild(btn);
    });

    highlightActiveSession(currentSessionId);
  }

  // === Highlight active session ===
  function highlightActiveSession(activeId) {
    const buttons = historyPanel.querySelectorAll(".history-item");
    buttons.forEach((btn, index) => {
      btn.classList.remove("active");
      if (btn.textContent === (sessions[activeId].find(msg => msg.sender === "user")?.text || "New Chat")) {
  btn.classList.add("active");
        btn.classList.add("active");
      }
    });
  }

  // === Get name from session ID ===
  function getSessionName(id) {
    const index = Object.keys(sessions).indexOf(id);
    return `Chat ${index + 1}`;
  }

  // === Send message ===
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    saveMessage("user", message);
    messageInput.value = "";

    try {
// ✅ Auto-detect backend URL (works for local file or hosted FastAPI)
const backendUrl = window.location.origin.startsWith("file://")
  ? "http://127.0.0.1:8000"   // when running index.html directly
  : window.location.origin;   // when served by FastAPI

const response = await fetch(`${backendUrl}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, session_id: currentSessionId }),
});

const data = await response.json();
const reply = data.reply || data.response || "Local test mode active ✅";

      addMessage("bot", reply);
      saveMessage("bot", reply);
    } catch (error) {
      const errMsg = "⚠️ Server not reachable (local test mode)";
      addMessage("bot", errMsg);
      saveMessage("bot", errMsg);
    }
  }

  // === Send triggers ===
  sendBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sendMessage();
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  // === Start new chat session ===
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    currentSessionId = generateSessionId();
    sessions[currentSessionId] = [];
    renderChat(currentSessionId);
    renderHistoryPanel();
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));

    // 🟢 Auto first message for every new chat
    showWelcomeMessage();
  });

  // === Toggle chat history panel (mobile friendly) ===
  if (toggleHistoryBtn) {
    toggleHistoryBtn.addEventListener("click", () => {
      historyPanel.classList.toggle("open");
    });
  }

  // === Auto welcome message for new sessions ===
  function showWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = "Hello";

    if (hour < 12) greeting = "Good morning 🌞";
    else if (hour < 18) greeting = "Good afternoon ☀️";
    else greeting = "Good evening 🌙";

    const welcomeText = `${greeting}! I'm SciSpark — your AI science study companion. Ask me questions, explore concepts, or take a quiz to learn interactively. 🚀`;

    addMessage("bot", welcomeText);
    saveMessage("bot", welcomeText);
  }
});