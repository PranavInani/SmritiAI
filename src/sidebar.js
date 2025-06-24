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

  // --- Dropdown Elements ---
  const dropdownToggle = document.getElementById('dropdown-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');
  const rebuildStatus = document.getElementById('rebuild-status');

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

  // --- Dropdown Logic ---
  let isDropdownOpen = false;

  function toggleDropdown() {
    isDropdownOpen = !isDropdownOpen;
    dropdownToggle.classList.toggle('open', isDropdownOpen);
    dropdownMenu.classList.toggle('hidden', !isDropdownOpen);
  }

  function closeDropdown() {
    isDropdownOpen = false;
    dropdownToggle.classList.remove('open');
    dropdownMenu.classList.add('hidden');
  }

  // Toggle dropdown on click
  dropdownToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownMenu.contains(e.target) && !dropdownToggle.contains(e.target)) {
      closeDropdown();
    }
  });

  // Handle dropdown item clicks
  dropdownMenu.addEventListener('click', async (e) => {
    const dropdownItem = e.target.closest('.dropdown-item');
    if (!dropdownItem || dropdownItem.classList.contains('disabled')) {
      return;
    }

    const action = dropdownItem.dataset.action;
    
    // Close dropdown after selection
    closeDropdown();

    // Handle different actions
    if (action === 'rebuild-index') {
      await handleRebuildIndex();
    }
    
    // Future actions can be added here
  });

  // Rebuild index handler
  async function handleRebuildIndex() {
    try {
      // Disable the rebuild option and show spinner
      const rebuildItem = document.querySelector('[data-action="rebuild-index"]');
      rebuildItem.classList.add('disabled');
      rebuildStatus.innerHTML = '<span class="spinner"></span>';

      // Send message to background script to rebuild index
      const response = await browser.runtime.sendMessage({
        action: 'rebuild-index'
      });

      if (response && response.success) {
        rebuildStatus.textContent = 'Complete!';
        // Clear status after 2 seconds
        setTimeout(() => {
          rebuildStatus.textContent = '';
          rebuildItem.classList.remove('disabled');
        }, 2000);
      } else {
        rebuildStatus.textContent = 'Failed';
        setTimeout(() => {
          rebuildStatus.textContent = '';
          rebuildItem.classList.remove('disabled');
        }, 3000);
      }
    } catch (error) {
      console.error('Error rebuilding index:', error);
      rebuildStatus.textContent = 'Error';
      setTimeout(() => {
        rebuildStatus.textContent = '';
        document.querySelector('[data-action="rebuild-index"]').classList.remove('disabled');
      }, 3000);
    }
  }
});