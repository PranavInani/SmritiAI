document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const loadingContainer = document.getElementById('loading-container');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  const loadingText = document.getElementById('loading-text');
  
  const chatContainer = document.getElementById('chat-container');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  const themeToggleButton = document.getElementById('theme-toggle-btn');
  const body = document.body;

  // --- Model Progress Listener ---
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'model-progress') {
        loadingContainer.classList.remove('hidden'); // Show loading screen
        chatContainer.classList.add('hidden');

        const { status, file, loaded, total } = message.payload;
        if (status === 'progress') {
            const percentage = total > 0 ? ((loaded / total) * 100).toFixed(1) : 0;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${percentage}%`;
            loadingText.textContent = `Downloading: ${file}`;
        } else if (status === 'ready') {
            loadingText.textContent = 'Model loaded. Finalizing...';
            progressBar.style.width = '100%';
        }
    }
  });

  // --- Theme Logic ---
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add('dark-mode');
      themeToggleButton.textContent = '🌙';
    } else {
      body.classList.remove('dark-mode');
      themeToggleButton.textContent = '☀️';
    }
  };

  const savedTheme = localStorage.getItem('sidebar-theme') || 'dark';
  applyTheme(savedTheme);

  themeToggleButton.addEventListener('click', () => {
    const isDarkMode = body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('sidebar-theme', newTheme);
  });

  // --- Chat Logic ---
  chatForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, 'sent');
    messageInput.value = '';
    
    try {
      // Send message to background to get embedding
      const response = await browser.runtime.sendMessage({
        type: 'get-embedding',
        text: messageText
      });

      // Hide loading screen and show chat again
      loadingContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');

      if (response.status === 'complete') {
        // For now, just log the embedding to confirm it works
        console.log('Received embedding:', response.output.slice(0, 5));
        appendMessage('I have converted your message to an embedding (see console).', 'received');
      }

    } catch (error) {
      console.error('Error getting embedding:', error);
      appendMessage('Sorry, an error occurred while processing your message.', 'received');
      loadingContainer.classList.add('hidden');
      chatContainer.classList.remove('hidden');
    }
  });

  function appendMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
  }
});