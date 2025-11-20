document.addEventListener("DOMContentLoaded", async () => {

  /* =========================================================
       ELEMENTS
  ========================================================== */
  const chatBox = document.getElementById("chat-box");
  const messageInput = document.getElementById("message");
  const sendBtn = document.getElementById("send-btn");
  const historyPanel = document.getElementById("history-panel");
  const welcomeScreen = document.getElementById("welcome-screen");

  const btnNewChat = document.getElementById("btn-new-chat");
  const btnSearchChats = document.getElementById("btn-search-chats");
  const btnQuizLibrary = document.getElementById("btn-quiz-library");
  const btnProjects = document.getElementById("btn-projects");

  const menuToggle = document.getElementById("menu-toggle");
  const shareBtn = document.getElementById("share-btn");
  const mobileShareBtn = document.getElementById("mobile-share-btn");
  const sidebarOverlay = document.getElementById("sidebar-overlay");

  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input");
  const closeSearchBtn = document.getElementById("close-search");

  /* =========================================================
       DEBUG FUNCTION
  ========================================================== */
  function debugChatVisibility() {
    console.log('=== CHAT VISIBILITY DEBUG ===');
    console.log('Welcome screen display:', welcomeScreen ? getComputedStyle(welcomeScreen).display : 'N/A');
    console.log('Chat box display:', chatBox ? getComputedStyle(chatBox).display : 'N/A');
    console.log('Chat box visibility:', chatBox ? getComputedStyle(chatBox).visibility : 'N/A');
    console.log('Current session messages:', sessions[currentSessionId] ? sessions[currentSessionId].length : 0);
    console.log('================================');
  }

  /* =========================================================
       MOBILE TOGGLE FUNCTIONALITY
  ========================================================== */
  function initMobileToggle() {
    if (menuToggle && historyPanel && sidebarOverlay) {
      // Toggle sidebar
      menuToggle.addEventListener('click', function() {
        historyPanel.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
      });
      
      // Close sidebar when clicking overlay
      sidebarOverlay.addEventListener('click', function() {
        historyPanel.classList.remove('open');
        sidebarOverlay.classList.remove('active');
      });
      
      // Close sidebar when clicking on a history item (mobile)
      const historyItems = document.querySelectorAll('.history-item');
      historyItems.forEach(item => {
        item.addEventListener('click', function() {
          if (window.innerWidth <= 850) {
            historyPanel.classList.remove('open');
            sidebarOverlay.classList.remove('active');
          }
        });
      });

      // Close sidebar when starting a new chat (mobile)
      if (btnNewChat) {
        btnNewChat.addEventListener('click', function() {
          if (window.innerWidth <= 850) {
            historyPanel.classList.remove('open');
            sidebarOverlay.classList.remove('active');
          }
        });
      }
    }
  }

  /* =========================================================
       SUGGESTION CARDS FUNCTIONALITY
  ========================================================== */
  function initSuggestionCards() {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    suggestionCards.forEach(card => {
      card.addEventListener('click', function() {
        const suggestionText = this.getAttribute('data-suggestion');
        if (suggestionText && messageInput) {
          messageInput.value = suggestionText;
          sendMessage();
        }
      });
    });
  }

  /* =========================================================
       CHAT SESSION SYSTEM
  ========================================================== */
  const CHAT_SESSIONS_KEY = "EduSparkChatSessions";
  let sessions = JSON.parse(localStorage.getItem(CHAT_SESSIONS_KEY)) || {};

  let currentSessionId = generateSessionId();

  if (!sessions[currentSessionId]) {
    sessions[currentSessionId] = [];
    showWelcomeMessage();
  } else {
    // If there's existing chat, show chat area instead of welcome screen
    showChatArea();
    renderChat(currentSessionId);
  }

  renderHistoryPanel();

  function generateSessionId() {
    return "session_" + Date.now();
  }

  /* =========================================================
       TOGGLE WELCOME/CHAT SCREENS - UPDATED
  ========================================================== */
  function showWelcomeScreen() {
    if (welcomeScreen) {
      welcomeScreen.style.display = 'flex';
      void welcomeScreen.offsetHeight; // Force reflow
    }
    if (chatBox) {
      chatBox.style.display = 'none';
    }
  }

  function showChatArea() {
    if (welcomeScreen) {
      welcomeScreen.style.display = 'none';
      void welcomeScreen.offsetHeight; // Force reflow
    }
    if (chatBox) {
      chatBox.style.display = 'flex';
      chatBox.style.visibility = 'visible';
      chatBox.style.opacity = '1';
      void chatBox.offsetHeight; // Force reflow and repaint
      chatBox.style.display = 'flex'; // Force reset
      
      // Double ensure visibility
      setTimeout(() => {
        if (chatBox) {
          chatBox.style.display = 'flex';
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 50);
    }
  }

  /* =========================================================
       RENDER CHAT - UPDATED
  ========================================================== */
  function renderChat(sessionId) {
    if (!chatBox) return;
    
    chatBox.innerHTML = "";
    const chatHistory = sessions[sessionId] || [];

    chatHistory.forEach(msg => addMessage(msg.sender, msg.text));
    
    // Force show chat area and ensure visibility
    showChatArea();
    debugChatVisibility();
  }

  function addMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", `${sender}-message`);

    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar", `${sender}-avatar`);
    avatarDiv.textContent = sender === "user" ? "Y" : "EB";

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("message-content");

    const textDiv = document.createElement("div");
    textDiv.classList.add("message-text");

    // Detect HTML for formatted output
    if (/<[a-z][\s\S]*>/i.test(text)) {
      textDiv.innerHTML = text;
    } else {
      textDiv.textContent = text;
    }

    const actionsDiv = document.createElement("div");
    actionsDiv.classList.add("message-actions");

    if (sender === "bot") {
      actionsDiv.innerHTML = `
        <button class="message-action"><i class="fas fa-thumbs-up"></i></button>
        <button class="message-action"><i class="fas fa-thumbs-down"></i></button>
        <button class="message-action"><i class="fas fa-copy"></i></button>
      `;
    } else {
      actionsDiv.innerHTML = `
        <button class="message-action"><i class="fas fa-pencil-alt"></i></button>
        <button class="message-action"><i class="fas fa-copy"></i></button>
      `;
    }

    contentDiv.appendChild(textDiv);
    contentDiv.appendChild(actionsDiv);
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);

    // Force visibility and scrolling
    messageDiv.style.display = 'flex';
    messageDiv.style.visibility = 'visible';
    messageDiv.style.opacity = '1';
    void messageDiv.offsetHeight;
    
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
    const historyContent = document.querySelector(".history-section");
    if (!historyContent) return;

    // Clear existing history items but keep the date headers
    const dateHeaders = historyContent.querySelectorAll('.history-date');
    const existingItems = historyContent.querySelectorAll('.history-item');
    existingItems.forEach(item => item.remove());

    const sessionIds = Object.keys(sessions);

    sessionIds.forEach(id => {
      const firstMsg = sessions[id].find(m => m.sender === "user");
      const historyText = firstMsg ? 
        (firstMsg.text.length > 30 ? firstMsg.text.substring(0, 30) + "..." : firstMsg.text) : 
        "New Chat";

      const historyItem = document.createElement("div");
      historyItem.classList.add("history-item");

      historyItem.innerHTML = `
        <i class="fas fa-comment"></i>
        <span>${historyText}</span>
      `;

      historyItem.onclick = () => {
        currentSessionId = id;
        renderChat(id);
        highlightActiveSession();
      };

      // Add to today's section
      const todaySection = dateHeaders[0]?.nextElementSibling || historyContent;
      historyContent.insertBefore(historyItem, todaySection);
    });

    highlightActiveSession();
  }

  function highlightActiveSession() {
    const items = document.querySelectorAll(".history-item");
    const firstMsg = sessions[currentSessionId].find(m => m.sender === "user");
    const currentText = firstMsg ? 
      (firstMsg.text.length > 30 ? firstMsg.text.substring(0, 30) + "..." : firstMsg.text) : 
      "New Chat";

    items.forEach(item => {
      item.classList.remove("active");
      const itemText = item.querySelector('span')?.textContent;
      if (itemText === currentText) {
        item.classList.add("active");
      }
    });
  }

  /* =========================================================
       SENDING MESSAGE - UPDATED
  ========================================================== */
  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Force show chat area immediately when sending a message
    showChatArea();
    debugChatVisibility();

    addMessage("user", message);
    saveMessage("user", message);
    messageInput.value = "";

    // Auto-resize textarea
    messageInput.style.height = 'auto';

    // Check if mobile for browser-specific fixes
    const isMobile = window.innerWidth <= 768;

    // Typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "message bot-message";
    typingDiv.style.display = 'flex';
    typingDiv.style.visibility = 'visible';
    typingDiv.style.opacity = '1';
    
    // Browser-specific styling
    if (isMobile) {
      typingDiv.style.webkitTransform = 'translateZ(0)';
      typingDiv.style.transform = 'translateZ(0)';
    }
    
    const avatarDiv = document.createElement("div");
    avatarDiv.classList.add("avatar", "bot-avatar");
    avatarDiv.textContent = "EB";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const textDiv = document.createElement("div");
    textDiv.classList.add("message-text");
    textDiv.textContent = "EduSpark is thinking...";

    contentDiv.appendChild(textDiv);
    typingDiv.appendChild(avatarDiv);
    typingDiv.appendChild(contentDiv);
    chatBox.appendChild(typingDiv);

    // Force reflow
    void typingDiv.offsetHeight;
    
    // Ensure scrolling works across browsers
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);

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

      const formatted = data.html;
      const plain = data.response || data.reply || "⚠️ No reply";
      const finalResponse = formatted || plain;

      // Update the typing indicator with the actual response
      const updateResponse = () => {
        if (/<[a-z][\s\S]*>/i.test(finalResponse)) {
          textDiv.innerHTML = finalResponse;
        } else {
          textDiv.textContent = finalResponse;
        }
        
        // Force browser repaint
        void textDiv.offsetHeight;
        
        // Ensure chat area stays visible
        showChatArea();
        
        // Final scroll to bottom
        setTimeout(() => {
          chatBox.scrollTop = chatBox.scrollHeight;
        }, 50);
      };

      // Use appropriate timing for different browsers
      setTimeout(updateResponse, isMobile ? 50 : 0);

      saveMessage("bot", finalResponse);

    } catch (err) {
      const showError = () => {
        textDiv.textContent = "⚠️ Server unreachable.";
        void textDiv.offsetHeight;
        showChatArea();
      };
      
      setTimeout(showError, isMobile ? 50 : 0);
      saveMessage("bot", "⚠️ Server unreachable.");
    }
  }

  sendBtn.addEventListener("click", e => {
    e.preventDefault();
    sendMessage();
  });

  messageInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  messageInput.addEventListener("input", function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
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
    showWelcomeScreen();

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
          ? "flex"
          : "none";
    });
  });

  /* =========================================================
       SHARE BUTTON (Copy last bot reply)
  ========================================================== */
  function shareLastReply() {
    const botMessages = document.querySelectorAll(".bot-message .message-text");
    if (botMessages.length === 0) return;

    const lastMessage = botMessages[botMessages.length - 1];
    const text = lastMessage.textContent || lastMessage.innerText;

    navigator.clipboard.writeText(text).then(() => {
      alert("Reply copied to clipboard!");
    }).catch(() => {
      alert("Failed to copy to clipboard");
    });
  }

  if (shareBtn) shareBtn.addEventListener("click", shareLastReply);
  if (mobileShareBtn) mobileShareBtn.addEventListener("click", shareLastReply);

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

    showWelcomeScreen();
  }

  /* =========================================================
       INITIALIZE EVERYTHING
  ========================================================== */
  initMobileToggle();
  initSuggestionCards();

  // Add click handlers for other sidebar buttons
  if (btnQuizLibrary) {
    btnQuizLibrary.addEventListener('click', () => {
      alert('Quiz Library feature coming soon!');
    });
  }

  if (btnProjects) {
    btnProjects.addEventListener('click', () => {
      alert('Projects feature coming soon!');
    });
  }

});
