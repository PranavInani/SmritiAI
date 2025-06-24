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
    
    const thinkingMessage = appendMessage('Thinking...', 'received');

    try {
      // Send the search query to the background script
      const results = await browser.runtime.sendMessage({
        action: 'search',
        query: messageText
      });

      // Remove the "Thinking..." message before displaying results
      thinkingMessage.remove();

      // Render the results in the chat window
      displayResults(results);

    } catch (error) {
      console.error('Error performing search:', error);
      thinkingMessage.textContent = 'Search failed. See console for details.';
    }
  });

  messageInput.addEventListener('input', () => {
    // Auto-resize textarea
    messageInput.style.height = 'auto';
    messageInput.style.height = `${messageInput.scrollHeight}px`;
  });

  function appendMessage(text, type) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement;
  }

  // --- Search Result Display Logic ---
  function displayResults(results) {
    if (!results || results.length === 0) {
        appendMessage('No results found.', 'received');
        return;
    }

    // Create a new message element to hold the results list
    const resultsMessageElement = document.createElement('div');
    resultsMessageElement.classList.add('message', 'received');

    // Create and append a list for the results
    const ul = document.createElement('ul');
    results.forEach(page => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = page.url;
        a.textContent = page.title;
        a.title = page.url; // Show the full URL on hover
        a.target = '_blank'; // Open link in a new tab
        li.appendChild(a);
        ul.appendChild(li);
    });
    resultsMessageElement.appendChild(ul);
    chatMessages.appendChild(resultsMessageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
  }
});