/**
 * Command System for handling slash commands
 */
export class CommandSystem {
  constructor(chatInterface, statsHandler, settingsModal) {
    this.chatInterface = chatInterface;
    this.statsHandler = statsHandler;
    this.settingsModal = settingsModal;
    
    this.messageInput = document.getElementById('message-input');
    this.commandDropdown = document.getElementById('command-dropdown');
    
    this.selectedCommandIndex = -1;
    this.availableCommands = [
      { command: '/clear', desc: 'Clear chat history' },
      { command: '/stats', desc: 'Show index statistics' },
      { command: '/settings', desc: 'Open settings' }
    ];
    
    this.init();
  }

  /**
   * Initialize command system
   */
  init() {
    // Handle input changes for command dropdown
    this.messageInput.addEventListener('input', () => {
      this.handleCommandDropdown();
    });

    // Handle keyboard navigation
    this.messageInput.addEventListener('keydown', (e) => {
      this.handleKeyNavigation(e);
    });

    // Handle form submission for commands
    const chatForm = document.getElementById('chat-form');
    const originalSubmitHandler = chatForm.onsubmit;
    
    chatForm.addEventListener('submit', async (event) => {
      const messageText = this.messageInput.value.trim();
      if (messageText.startsWith('/')) {
        event.preventDefault();
        await this.handleSlashCommand(messageText);
        this.messageInput.value = '';
        return;
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.messageInput.contains(e.target) && !this.commandDropdown.contains(e.target)) {
        this.hideCommandDropdown();
      }
    });
  }

  /**
   * Handle command dropdown display
   */
  handleCommandDropdown() {
    const value = this.messageInput.value;
    
    if (value.startsWith('/') && value.length > 0) {
      const query = value.toLowerCase();
      const filteredCommands = this.availableCommands.filter(cmd => 
        cmd.command.startsWith(query) || query === '/'
      );
      
      if (filteredCommands.length > 0) {
        this.showCommandDropdown(filteredCommands);
      } else {
        this.hideCommandDropdown();
      }
    } else {
      this.hideCommandDropdown();
    }
  }

  /**
   * Show command dropdown
   * @param {Array} commands - Commands to show
   */
  showCommandDropdown(commands) {
    this.commandDropdown.innerHTML = '';
    
    commands.forEach((cmd, index) => {
      const item = document.createElement('div');
      item.className = 'command-item';
      item.dataset.command = cmd.command;
      if (index === this.selectedCommandIndex) {
        item.classList.add('selected');
      }
      
      // Highlight matching text
      const query = this.messageInput.value.toLowerCase();
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
        this.messageInput.value = cmd.command;
        this.hideCommandDropdown();
        this.messageInput.focus();
      });
      
      this.commandDropdown.appendChild(item);
    });
    
    this.commandDropdown.classList.remove('hidden');
    this.selectedCommandIndex = -1;
  }

  /**
   * Hide command dropdown
   */
  hideCommandDropdown() {
    this.commandDropdown.classList.add('hidden');
    this.selectedCommandIndex = -1;
  }

  /**
   * Handle keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyNavigation(e) {
    if (!this.commandDropdown.classList.contains('hidden')) {
      const items = this.commandDropdown.querySelectorAll('.command-item');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedCommandIndex = Math.min(this.selectedCommandIndex + 1, items.length - 1);
        this.updateCommandSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedCommandIndex = Math.max(this.selectedCommandIndex - 1, -1);
        this.updateCommandSelection(items);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        if (this.selectedCommandIndex >= 0 && this.selectedCommandIndex < items.length) {
          e.preventDefault();
          const selectedCommand = items[this.selectedCommandIndex].dataset.command;
          this.messageInput.value = selectedCommand;
          this.hideCommandDropdown();
        }
      } else if (e.key === 'Escape') {
        this.hideCommandDropdown();
      }
    }
  }

  /**
   * Update command selection visual state
   * @param {NodeList} items - Command items
   */
  updateCommandSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedCommandIndex);
    });
  }

  /**
   * Handle slash command execution
   * @param {string} command - Command to execute
   */
  async handleSlashCommand(command) {
    const commandMap = {
      '/clear': this.handleClearCommand.bind(this),
      '/stats': this.handleStatsCommand.bind(this),
      '/settings': this.handleSettingsCommand.bind(this)
    };

    const handler = commandMap[command];
    if (handler) {
      await handler();
    } else {
      this.chatInterface.addMessage(
        `Unknown command: ${command}. Available commands: /clear, /stats, /settings`, 
        'received'
      );
    }
  }

  /**
   * Handle clear command
   */
  handleClearCommand() {
    this.chatInterface.clearChat();
  }

  /**
   * Handle stats command
   */
  async handleStatsCommand() {
    await this.statsHandler.showStats();
  }

  /**
   * Handle settings command
   */
  handleSettingsCommand() {
    this.settingsModal.show();
  }
}
