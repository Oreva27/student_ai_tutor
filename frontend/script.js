document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
       ELEMENTS
  ========================================================== */
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message");
  const sendBtn = document.getElementById("send-btn");
  const historyPanel = document.getElementById("history-panel");

  const btnNewChat = document.getElementById("btn-new-chat");
  const btnSearchChats = document.getElementById("btn-search-chats");
  const btnQuizLibrary = document.getElementById("btn-quiz-library");
  const btnProjects = document.getElementById("btn-projects");

  const openMenuBtn = document.getElementById("open-menu");
  const shareBtn = document.getElementById("share-btn");
  const shareBtnMobile = document.getElementById("share-btn-mobile");

  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input");
  const closeSearchBtn = document.getElementById("close-search");

  /* =========================================================
       CHAT SESSION SYSTEM
  ========================================================== */
  const CHAT_SESSIONS_KEY = "EduSparkChatSessions";
  let sessions = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY)) || {};

  let currentSessionId = generateSessionId();

  if (!sessions[currentSessionId]) {
    sessions[currentSessionId] = [];
    showWelcomeMessage();
  }

  renderHistoryPanel();

  function generateSessionId() {
    return "session_" + Date.now();
  }

  /* =========================================================
       RENDER CHAT
  ========================================================== */
  function renderChat(sessionId) {
    chatBox.innerHTML = "";
    const chatHistory = sessions[sessionId] || [];

    chatHistory.forEach(msg => addMessage(msg.sender, msg.text));
  }

  function addMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // Detect HTML for formatted output
    if (/<[a-z][\s\S]*>/i.test(text)) {
      bubble.innerHTML = text;
    } else {
      bubble.textContent = text;
    }

    msgDiv.appendChild(bubble);
    chatBox.appendChild(msgDiv);

    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function saveMessage(sender, text) {
    sessions[currentSessionId].push({ sender, text });
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    renderHistoryPanel();
  }

  /* =========================================================
       RENDER HISTORY PANEL
  ========================================================== */
  function renderHistoryPanel() {
    const historyContent = document.getElementById("history-content");
    historyContent.innerHTML = "";

    const sessionIds = Object.keys(sessions);

    sessionIds.forEach(id => {
      const btn = document.createElement("button");
      btn.classList.add("history-item");

      const firstMsg = sessions[id].find(m => m.sender === "user");
      btn.textContent = firstMsg ? firstMsg.text : "New Chat";

      btn.onclick = () => {
        currentSessionId = id;
        renderChat(id);
        highlightActiveSession();
      };

      historyContent.appendChild(btn);
    });

    highlightActiveSession();
  }

  function highlightActiveSession() {
    const items = document.querySelectorAll(".history-item");

    items.forEach(item => {
      item.classList.remove("active");

      const firstMsg = sessions[currentSessionId].find(m => m.sender === "user");
      if (item.textContent === (firstMsg ? firstMsg.text : "New Chat")) {
        item.classList.add("active");
      }
    });
  }

  /* =========================================================
       SENDING MESSAGE
  ========================================================== */
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    addMessage("user", message);
    saveMessage("user", message);
    messageInput.value = "";

    // Typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot typing";
    typingDiv.textContent = "EduSpark is thinking...";
    chatBox.appendChild(typingDiv);

    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const backendUrl = window.location.origin.startsWith("file://")
        ? "http://127.0.0.1:8000"
        : window.location.origin;

      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_id: currentSessionId
        })
      });

      const data = await response.json();
      typingDiv.remove();

      const formatted = data.html;
      const plain = data.response || data.reply || "⚠️ No reply";

      if (formatted) {
        addMessage("bot", formatted);
        saveMessage("bot", formatted);
      } else {
        addMessage("bot", plain);
        saveMessage("bot", plain);
      }

    } catch (err) {
      typingDiv.remove();
      const msg = "⚠️ Server unreachable.";
      addMessage("bot", msg);
      saveMessage("bot", msg);
    }
  }

  sendBtn.addEventListener("click", e => {
    e.preventDefault();
    sendMessage();
  });

  messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  /* =========================================================
       NEW CHAT BUTTON
  ========================================================== */
  btnNewChat.addEventListener("click", () => {
    currentSessionId = generateSessionId();
    sessions[currentSessionId] = [];
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));

    chatBox.innerHTML = "";
    messageInput.value = "";

    const p = document.createElement("div");
    p.className = "system-msg";
    p.textContent = "New chat started.";
    chatBox.appendChild(p);

    renderHistoryPanel();
  });

  /* =========================================================
       SEARCH CHAT (Overlay)
  ========================================================== */
  btnSearchChats.addEventListener("click", () => {
    searchOverlay.classList.remove("hidden");
    searchInput.focus();
  });

  closeSearchBtn.addEventListener("click", () => {
    searchOverlay.classList.add("hidden");
    searchInput.value = "";
  });

  searchInput.addEventListener("input", e => {
    const text = e.target.value.toLowerCase();
    const items = document.querySelectorAll(".history-item");

    items.forEach(item => {
      item.style.display =
        item.textContent.toLowerCase().includes(text)
          ? "block"
          : "none";
    });
  });

  /* =========================================================
       MOBILE MENU
  ========================================================== */
  if (openMenuBtn) {
    openMenuBtn.addEventListener("click", () => {
      historyPanel.classList.add("open");
    });
  }

  document.addEventListener("click", e => {
    if (
      !historyPanel.contains(e.target) &&
      !openMenuBtn.contains(e.target)
    ) {
      historyPanel.classList.remove("open");
    }
  });

  /* =========================================================
       SHARE BUTTON (Copy last bot reply)
  ========================================================== */
  function shareLastReply() {
    const msgs = [...document.querySelectorAll(".message.bot .bubble")];
    if (msgs.length === 0) return;

    const last = msgs[msgs.length - 1].innerText;

    navigator.clipboard.writeText(last);
    alert("Reply copied to clipboard!");
  }

  if (shareBtn) shareBtn.addEventListener("click", shareLastReply);
  if (shareBtnMobile) shareBtnMobile.addEventListener("click", shareLastReply);

  

  /* =========================================================
       WELCOME MESSAGE
  ========================================================== */
  function showWelcomeMessage() {
    const hour = new Date().getHours();

    let greeting =
      hour < 12 ? "Good morning 🌞"
      : hour < 18 ? "Good afternoon ☀️"
      : "Good evening 🌙";

    const welcome = `${greeting}! I'm EduSpark — your science study companion. Ask me anything to begin. 🚀`;

    addMessage("bot", welcome);
    saveMessage("bot", welcome);
  }

});
