document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const chatContainer = document.getElementById('chat-container');
  const chatForm = document.getElementById('chat-form');
  const messageInput = document.getElementById('message-input');
  const chatMessages = document.getElementById('chat-messages');
  const themeToggleButton = document.getElementById('theme-toggle-btn');
  const body = document.body;

  // --- Command Dropdown Elements ---
  const commandDropdown = document.getElementById('command-dropdown');
  const commandItems = document.querySelectorAll('.command-item');

  // --- Dropdown Elements ---
  const dropdownToggle = document.getElementById('dropdown-toggle');
  const dropdownMenu = document.getElementById('dropdown-menu');

  // --- Modal Elements ---
  const settingsModal = document.getElementById('settings-modal');
  const confirmationModal = document.getElementById('confirmation-modal');
  const closeSettings = document.getElementById('close-settings');
  const closeConfirm = document.getElementById('close-confirm');
  const saveSettings = document.getElementById('save-settings');
  const resetSettings = document.getElementById('reset-settings');
  const rebuildIndexBtn = document.getElementById('rebuild-index-btn');
  const rebuildIndexText = document.getElementById('rebuild-index-text');
  const rebuildIndexSpinner = document.getElementById('rebuild-index-spinner');
  const exportHistoryBtn = document.getElementById('export-history-btn');
  const exportHistoryText = document.getElementById('export-history-text');
  const exportHistorySpinner = document.getElementById('export-history-spinner');
  const historyTimeRange = document.getElementById('history-time-range');
  const confirmYes = document.getElementById('confirm-yes');
  const confirmNo = document.getElementById('confirm-no');
  const confirmTitle = document.getElementById('confirm-title');
  const confirmMessage = document.getElementById('confirm-message');
  const importFileInput = document.getElementById('import-file-input');

  // Settings values
  let currentSettings = {
    searchResultCount: 5,
    hnswEf: 200,
    hnswM: 16,
    maxElements: 10000,
    autoIndex: true
  };

  // Load settings on startup
  loadSettings();

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

    // Handle slash commands
    if (messageText.startsWith('/')) {
      await handleSlashCommand(messageText);
      messageInput.value = '';
      return;
    }

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
    
    // Handle command dropdown
    handleCommandDropdown();
  });

  // --- Command Dropdown Logic ---
  let selectedCommandIndex = -1;

  function handleCommandDropdown() {
    const value = messageInput.value;
    
    if (value.startsWith('/') && value.length > 0) {
      const query = value.toLowerCase();
      const availableCommands = [
        { command: '/clear', desc: 'Clear chat history' },
        { command: '/stats', desc: 'Show index statistics' },
        { command: '/settings', desc: 'Open settings' }
      ];
      
      const filteredCommands = availableCommands.filter(cmd => 
        cmd.command.startsWith(query) || query === '/'
      );
      
      if (filteredCommands.length > 0) {
        showCommandDropdown(filteredCommands);
      } else {
        hideCommandDropdown();
      }
    } else {
      hideCommandDropdown();
    }
  }

  function showCommandDropdown(commands) {
    commandDropdown.innerHTML = '';
    
    commands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'command-item';
      item.dataset.command = cmd.command;
      if (index === selectedCommandIndex) {
        item.classList.add('selected');
      }
      
      // Highlight matching text
      const query = messageInput.value.toLowerCase();
      let commandText = cmd.command;
      if (query.length > 1) {
        const matchIndex = cmd.command.toLowerCase().indexOf(query);
        if (matchIndex !== -1) {
          commandText = cmd.command.substring(0, matchIndex) + 
                       '<strong>' + cmd.command.substring(matchIndex, matchIndex + query.length) + '</strong>' + 
                       cmd.command.substring(matchIndex + query.length);
        }
      }
      
      item.innerHTML = `
        <span class="command-name">${commandText}</span>
        <span class="command-desc">${cmd.desc}</span>
      `;
      
      item.addEventListener('click', () => {
        messageInput.value = cmd.command;
        hideCommandDropdown();
        messageInput.focus();
      });
      
      commandDropdown.appendChild(item);
    });
    
    commandDropdown.classList.remove('hidden');
    selectedCommandIndex = -1;
  }

  function hideCommandDropdown() {
    commandDropdown.classList.add('hidden');
    selectedCommandIndex = -1;
  }

  // Handle keyboard navigation for command dropdown
  messageInput.addEventListener('keydown', (e) => {
    if (!commandDropdown.classList.contains('hidden')) {
      const items = commandDropdown.querySelectorAll('.command-item');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedCommandIndex = Math.min(selectedCommandIndex + 1, items.length - 1);
        updateCommandSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedCommandIndex = Math.max(selectedCommandIndex - 1, -1);
        updateCommandSelection(items);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (selectedCommandIndex >= 0 && selectedCommandIndex < items.length) {
          e.preventDefault();
          const selectedCommand = items[selectedCommandIndex].dataset.command;
          messageInput.value = selectedCommand;
          hideCommandDropdown();
        }
      } else if (e.key === 'Escape') {
        hideCommandDropdown();
      }
    }
  });

  function updateCommandSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === selectedCommandIndex);
    });
  }

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!messageInput.contains(e.target) && !commandDropdown.contains(e.target)) {
      hideCommandDropdown();
    }
  });

  // --- Slash Command Handler ---
  async function handleSlashCommand(command) {
    const commandMap = {
      '/clear': handleClearCommand,
      '/stats': handleStatsCommand,
      '/settings': handleSettingsCommand
    };

    const handler = commandMap[command];
    if (handler) {
      await handler();
    } else {
      appendMessage(`Unknown command: ${command}. Available commands: /clear, /stats, /settings`, 'received');
    }
  }

  // Clear chat command
  function handleClearCommand() {
    // Clear all messages but keep the initial greeting
    chatMessages.innerHTML = '<div class="message received">Search your memories.</div>';
  }

  // Stats command - shows index statistics
  async function handleStatsCommand() {
    try {
      const response = await browser.runtime.sendMessage({
        action: 'get-index-stats'
      });

      if (response.success) {
        displayIndexStats(response.stats);
      } else {
        appendMessage('Failed to get index stats.', 'received');
      }
    } catch (error) {
      console.error('Error getting index stats:', error);
      appendMessage('Error getting index stats. See console for details.', 'received');
    }
  }

  // Settings command - opens settings modal
  function handleSettingsCommand() {
    settingsModal.classList.remove('hidden');
  }

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
    if (action === 'index-stats') {
      await handleIndexStats();
    } else if (action === 'settings') {
      openSettingsModal();
    } else if (action === 'export-data') {
      await handleExportData();
    } else if (action === 'import-data') {
      handleImportData();
    } else if (action === 'clear-data') {
      handleClearData();
    }
    
    // Future actions can be added here
  });

  // Rebuild index handler (now in settings)
  async function handleRebuildIndex() {
    try {
      // Disable the rebuild button and show spinner
      rebuildIndexBtn.disabled = true;
      rebuildIndexText.textContent = 'Rebuilding...';
      rebuildIndexSpinner.classList.remove('hidden');

      // Send message to background script to rebuild index
      const response = await browser.runtime.sendMessage({
        action: 'rebuild-index'
      });

      if (response && response.success) {
        rebuildIndexText.textContent = 'Rebuild Complete!';
        rebuildIndexSpinner.classList.add('hidden');
        // Reset button after 2 seconds
        setTimeout(() => {
          rebuildIndexText.textContent = 'Rebuild Index';
          rebuildIndexBtn.disabled = false;
        }, 2000);
      } else {
        rebuildIndexText.textContent = 'Rebuild Failed';
        rebuildIndexSpinner.classList.add('hidden');
        setTimeout(() => {
          rebuildIndexText.textContent = 'Rebuild Index';
          rebuildIndexBtn.disabled = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error rebuilding index:', error);
      rebuildIndexText.textContent = 'Rebuild Error';
      rebuildIndexSpinner.classList.add('hidden');
      setTimeout(() => {
        rebuildIndexText.textContent = 'Rebuild Index';
        rebuildIndexBtn.disabled = false;
      }, 3000);
    }
  }

  // Export browser history handler
  async function handleExportHistory() {
    try {
      // Disable the export button and show spinner
      exportHistoryBtn.disabled = true;
      exportHistoryText.textContent = 'Exporting...';
      exportHistorySpinner.classList.remove('hidden');

      // Get the selected time range
      const timeRange = historyTimeRange.value;

      // Send message to background script to get browser history
      const response = await browser.runtime.sendMessage({
        action: 'export-browser-history',
        timeRange: timeRange
      });

      if (response && response.success) {
        // Create and download the file
        const dataStr = JSON.stringify(response.history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        
        // Include time range in filename
        const timeRangeText = timeRange === 'all' ? 'all-time' : timeRange;
        link.download = `firefox-history-${timeRangeText}-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        exportHistoryText.textContent = `Export Complete! (${response.count} items)`;
        exportHistorySpinner.classList.add('hidden');
        // Reset button after 3 seconds
        setTimeout(() => {
          exportHistoryText.textContent = 'Export Browser History';
          exportHistoryBtn.disabled = false;
        }, 3000);
      } else {
        exportHistoryText.textContent = 'Export Failed';
        exportHistorySpinner.classList.add('hidden');
        setTimeout(() => {
          exportHistoryText.textContent = 'Export Browser History';
          exportHistoryBtn.disabled = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error exporting browser history:', error);
      exportHistoryText.textContent = 'Export Error';
      exportHistorySpinner.classList.add('hidden');
      setTimeout(() => {
        exportHistoryText.textContent = 'Export Browser History';
        exportHistoryBtn.disabled = false;
      }, 3000);
    }
  }

  // Index stats handler
  async function handleIndexStats() {
    try {
      // Send message to background script to get stats
      const response = await browser.runtime.sendMessage({
        action: 'get-index-stats'
      });

      if (response && response.success) {
        displayIndexStats(response.stats);
      } else {
        appendMessage('Failed to get index statistics.', 'received');
      }
    } catch (error) {
      console.error('Error getting index stats:', error);
      appendMessage('Error getting index statistics.', 'received');
    }
  }

  // Display index stats in chat
  function displayIndexStats(stats) {
    const statsMessage = document.createElement('div');
    statsMessage.classList.add('message', 'received');
    
    let statusIcon = stats.indexInitialized ? '✅' : '❌';
    let memoryMB = (stats.approximateMemoryUsage?.total / (1024 * 1024)).toFixed(2);
    
    statsMessage.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📊 Index Statistics</div>
      <div style="font-family: monospace; font-size: 0.85em; line-height: 1.4;">
        <div><strong>Status:</strong> ${statusIcon} ${stats.indexInitialized ? 'Active' : 'Inactive'}</div>
        <div><strong>Total Pages:</strong> ${stats.totalPages}</div>
        <div><strong>Valid Embeddings:</strong> ${stats.validEmbeddings}</div>
        ${stats.invalidEmbeddings > 0 ? `<div><strong>Invalid Embeddings:</strong> ${stats.invalidEmbeddings}</div>` : ''}
        <div><strong>Memory Usage:</strong> ~${memoryMB} MB</div>
        ${stats.hnswCurrentCount !== 'N/A' ? `<div><strong>HNSW Index Size:</strong> ${stats.hnswCurrentCount} / ${stats.hnswMaxElements}</div>` : ''}
        <br>
        <div><strong>Configuration:</strong></div>
        <div style="margin-left: 10px;">
          <div>• Dimension: ${stats.config.dimension}</div>
          <div>• Distance: ${stats.config.metric}</div>
          <div>• M: ${stats.config.M}, ef: ${stats.config.ef}</div>
        </div>
        ${stats.oldestEntry ? `<br><div><strong>Oldest Entry:</strong> ${new Date(stats.oldestEntry).toLocaleDateString()}</div>` : ''}
        ${stats.newestEntry ? `<div><strong>Newest Entry:</strong> ${new Date(stats.newestEntry).toLocaleDateString()}</div>` : ''}
      </div>
    `;
    
    chatMessages.appendChild(statsMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- Settings Management ---
  function loadSettings() {
    const saved = localStorage.getItem('smriti-settings');
    if (saved) {
      currentSettings = { ...currentSettings, ...JSON.parse(saved) };
    }
    updateSettingsUI();
  }

  function saveSettingsToStorage() {
    localStorage.setItem('smriti-settings', JSON.stringify(currentSettings));
  }

  function updateSettingsUI() {
    document.getElementById('search-result-count').value = currentSettings.searchResultCount;
    document.getElementById('hnsw-ef').value = currentSettings.hnswEf;
    document.getElementById('hnsw-m').value = currentSettings.hnswM;
    document.getElementById('max-elements').value = currentSettings.maxElements;
    document.getElementById('auto-index').checked = currentSettings.autoIndex;
  }

  function openSettingsModal() {
    updateSettingsUI();
    settingsModal.classList.remove('hidden');
  }

  function closeSettingsModal() {
    settingsModal.classList.add('hidden');
  }

  // --- Export Data Handler ---
  async function handleExportData() {
    try {
      const exportStatus = document.getElementById('export-status');
      exportStatus.innerHTML = '<span class="spinner"></span>';

      const response = await browser.runtime.sendMessage({
        action: 'export-data'
      });

      if (response && response.success) {
        // Create and download the file
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `smriti-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        exportStatus.innerHTML = '<span class="success-text">✓</span>';
        setTimeout(() => exportStatus.textContent = '', 2000);
      } else {
        exportStatus.innerHTML = '<span class="error-text">✗</span>';
        setTimeout(() => exportStatus.textContent = '', 3000);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      document.getElementById('export-status').innerHTML = '<span class="error-text">✗</span>';
      setTimeout(() => document.getElementById('export-status').textContent = '', 3000);
    }
  }

  // --- Import Data Handler ---
  function handleImportData() {
    importFileInput.click();
  }

  // --- Clear Data Handler ---
  function handleClearData() {
    showConfirmation(
      'Clear All Data',
      'This will permanently delete all saved pages, embeddings, and search index. This action cannot be undone. Are you sure?',
      async () => {
        try {
          const clearStatus = document.getElementById('clear-status');
          clearStatus.innerHTML = '<span class="spinner"></span>';

          const response = await browser.runtime.sendMessage({
            action: 'clear-all-data'
          });

          if (response && response.success) {
            clearStatus.innerHTML = '<span class="success-text">✓</span>';
            appendMessage('All data has been cleared successfully.', 'received');
            setTimeout(() => clearStatus.textContent = '', 2000);
          } else {
            clearStatus.innerHTML = '<span class="error-text">✗</span>';
            setTimeout(() => clearStatus.textContent = '', 3000);
          }
        } catch (error) {
          console.error('Error clearing data:', error);
          document.getElementById('clear-status').innerHTML = '<span class="error-text">✗</span>';
          setTimeout(() => document.getElementById('clear-status').textContent = '', 3000);
        }
      }
    );
  }

  // --- Confirmation Modal ---
  function showConfirmation(title, message, onConfirm) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmationModal.classList.remove('hidden');
    
    // Remove any existing listeners
    const newConfirmYes = confirmYes.cloneNode(true);
    confirmYes.parentNode.replaceChild(newConfirmYes, confirmYes);
    
    newConfirmYes.addEventListener('click', () => {
      confirmationModal.classList.add('hidden');
      onConfirm();
    });
  }

  // --- Event Listeners ---
  
  // Settings modal
  closeSettings.addEventListener('click', closeSettingsModal);
  
  // Rebuild index button
  rebuildIndexBtn.addEventListener('click', async () => {
    await handleRebuildIndex();
  });

  // Export history button
  exportHistoryBtn.addEventListener('click', async () => {
    await handleExportHistory();
  });
  
  saveSettings.addEventListener('click', () => {
    // Get values from form
    currentSettings.searchResultCount = parseInt(document.getElementById('search-result-count').value);
    currentSettings.hnswEf = parseInt(document.getElementById('hnsw-ef').value);
    currentSettings.hnswM = parseInt(document.getElementById('hnsw-m').value);
    currentSettings.maxElements = parseInt(document.getElementById('max-elements').value);
    currentSettings.autoIndex = document.getElementById('auto-index').checked;
    
    saveSettingsToStorage();
    
    // Send updated settings to background script
    browser.runtime.sendMessage({
      action: 'update-settings',
      settings: currentSettings
    });
    
    closeSettingsModal();
    appendMessage('Settings saved successfully!', 'received');
  });

  resetSettings.addEventListener('click', () => {
    showConfirmation(
      'Reset Settings',
      'This will reset all settings to their default values. Continue?',
      () => {
        currentSettings = {
          searchResultCount: 5,
          hnswEf: 200,
          hnswM: 16,
          maxElements: 10000,
          autoIndex: true
        };
        saveSettingsToStorage();
        updateSettingsUI();
        appendMessage('Settings reset to defaults.', 'received');
      }
    );
  });

  // Confirmation modal
  closeConfirm.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
  });

  confirmNo.addEventListener('click', () => {
    confirmationModal.classList.add('hidden');
  });

  // Import file handler
  importFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importStatus = document.getElementById('import-status');
      importStatus.innerHTML = '<span class="spinner"></span>';

      const text = await file.text();
      const data = JSON.parse(text);

      const response = await browser.runtime.sendMessage({
        action: 'import-data',
        data: data
      });

      if (response && response.success) {
        importStatus.innerHTML = '<span class="success-text">✓</span>';
        appendMessage(`Successfully imported ${response.imported} pages!`, 'received');
        setTimeout(() => importStatus.textContent = '', 2000);
      } else {
        importStatus.innerHTML = '<span class="error-text">✗</span>';
        setTimeout(() => importStatus.textContent = '', 3000);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      document.getElementById('import-status').innerHTML = '<span class="error-text">✗</span>';
      setTimeout(() => document.getElementById('import-status').textContent = '', 3000);
    }

    // Reset file input
    event.target.value = '';
  });

  // Close modals when clicking outside
  [settingsModal, confirmationModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.add('hidden');
      }
    });
  });
});