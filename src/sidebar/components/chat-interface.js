import { appendMessage } from '../utils/dom-helpers.js';
import { sendSearchQuery } from '../services/message-service.js';

/**
 * Chat Interface Manager
 */
export class ChatInterface {
  constructor() {
    this.chatForm = document.getElementById('chat-form');
    this.messageInput = document.getElementById('message-input');
    this.chatMessages = document.getElementById('chat-messages');
    this.init();
  }

  /**
   * Initialize chat interface
   */
  init() {
    // Set up form submission
    this.chatForm.addEventListener('submit', async (event) => {
      await this.handleFormSubmit(event);
    });

    // Set up input auto-resize
    this.messageInput.addEventListener('input', () => {
      this.autoResizeInput();
    });
  }

  /**
   * Handle form submission
   * @param {Event} event - Form submit event
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    const messageText = this.messageInput.value.trim();
    if (!messageText) return;

    // Handle slash commands (delegate to command handler)
    if (messageText.startsWith('/')) {
      // This will be handled by the command system
      return;
    }

    // Handle regular search
    await this.performSearch(messageText);
  }

  /**
   * Perform a search query
   * @param {string} query - Search query
   */
  async performSearch(query) {
    this.addMessage(query, 'sent');
    this.clearInput();
    
    const thinkingMessage = this.addMessage('Thinking...', 'received');

    try {
      const results = await sendSearchQuery(query);
      thinkingMessage.remove();
      this.displayResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
      thinkingMessage.textContent = 'Search failed. See console for details.';
    }
  }

  /**
   * Add a message to the chat
   * @param {string} text - Message text
   * @param {string} type - Message type ('sent' | 'received')
   * @returns {HTMLElement} Created message element
   */
  addMessage(text, type) {
    return appendMessage(text, type, this.chatMessages);
  }

  /**
   * Display search results
   * @param {Array} results - Search results
   */
  displayResults(results) {
    if (!results || results.length === 0) {
      this.addMessage('No results found.', 'received');
      return;
    }

    const resultsMessageElement = document.createElement('div');
    resultsMessageElement.classList.add('message', 'received');

    const ul = document.createElement('ul');
    results.forEach(page => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = page.url;
      a.textContent = page.title;
      a.title = page.url;
      a.target = '_blank';
      li.appendChild(a);
      ul.appendChild(li);
    });
    
    resultsMessageElement.appendChild(ul);
    this.chatMessages.appendChild(resultsMessageElement);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * Clear the input field
   */
  clearInput() {
    this.messageInput.value = '';
    this.autoResizeInput();
  }

  /**
   * Auto-resize the input field
   */
  autoResizeInput() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = `${this.messageInput.scrollHeight}px`;
  }

  /**
   * Clear all chat messages except the greeting
   */
  clearChat() {
    this.chatMessages.innerHTML = '<div class="message received">Search your memories.</div>';
  }

  /**
   * Show first time welcome message
   */
  showFirstTimeWelcome() {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message received';
    welcomeMessage.innerHTML = `
      <div class="first-time-welcome">
        <p><strong>Welcome to SmritiAI! 🧠</strong></p>
        <p>I can help you search through your browsing history using AI. To get started, would you like me to process your existing browser history?</p>
        <div class="welcome-actions">
          <button id="welcome-process-history" class="btn-primary" style="margin: 8px 4px;">
            📚 Process My History
          </button>
          <button id="welcome-skip" class="btn-secondary" style="margin: 8px 4px;">
            ⏭️ Skip for Now
          </button>
        </div>
        <p><small>You can always process your history later from Settings → Browser History Processing</small></p>
      </div>
    `;
    
    this.chatMessages.appendChild(welcomeMessage);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    return welcomeMessage;
  }
}
