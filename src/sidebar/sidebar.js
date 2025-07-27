import { ThemeManager } from './components/theme-manager.js';
import { ChatInterface } from './components/chat-interface.js';
import { CommandSystem } from './components/command-system.js';
import { SettingsModal } from './components/settings-modal.js';
import { ConfirmationModal } from './components/confirmation-modal.js';
import { HeaderDropdown } from './components/header-dropdown.js';
import { DomainFilter } from './components/domain-filter.js';
import { StatsHandler } from './handlers/stats-handler.js';
import { DataHandler } from './handlers/data-handler.js';
import { FirstTimeHandler } from './handlers/first-time-handler.js';

/**
 * Main Sidebar Application
 * Coordinates all components and handles initialization
 */
class SidebarApp {
  constructor() {
    this.components = {};
    this.handlers = {};
  }

  /**
   * Initialize the sidebar application
   */
  async init() {
    // Initialize core components
    await this.initializeComponents();
    
    // Set up component dependencies
    this.setupDependencies();
    
    // Handle first time user experience
    this.handlers.firstTime.checkFirstTimeUser();
  }

  /**
   * Initialize all components
   */
  async initializeComponents() {
    // Core UI components
    this.components.theme = new ThemeManager();
    this.components.chat = new ChatInterface();
    this.components.confirmationModal = new ConfirmationModal();
    
    // Initialize domain filter and wait for it to complete
    this.components.domainFilter = new DomainFilter();
    await this.components.domainFilter.init();
    
    // Handlers
    this.handlers.stats = new StatsHandler(this.components.chat);
    this.handlers.data = new DataHandler(this.components.chat, this.components.confirmationModal);
    
    // Modal components (need handlers as dependencies)
    this.components.settingsModal = new SettingsModal(this.components.chat);
    this.components.settingsModal.setConfirmationModal(this.components.confirmationModal);
    
    // Header dropdown (needs multiple dependencies)
    this.components.headerDropdown = new HeaderDropdown(
      this.handlers.stats,
      this.components.settingsModal,
      this.handlers.data
    );
    
    // Command system (needs multiple dependencies)
    this.components.commandSystem = new CommandSystem(
      this.components.chat,
      this.handlers.stats,
      this.components.settingsModal
    );
    
    // First time handler
    this.handlers.firstTime = new FirstTimeHandler(
      this.components.chat,
      this.components.settingsModal
    );
  }

  /**
   * Set up component dependencies and cross-references
   */
  setupDependencies() {
    // Set domain filter reference in chat interface and command system
    this.components.chat.setDomainFilter(this.components.domainFilter);
    this.components.commandSystem.setDomainFilter(this.components.domainFilter);
    
    // Mount domain filter in the UI
    this.mountDomainFilter();
    
    // Set up domain filter event listeners
    this.setupDomainFilterEvents();
  }

  /**
   * Mount the domain filter component in the UI
   */
  mountDomainFilter() {
    const chatContainer = document.getElementById('chat-container');
    const chatMessages = document.getElementById('chat-messages');
    
    // Insert domain filter between header and messages
    const domainFilterElement = this.components.domainFilter.getElement();
    chatContainer.insertBefore(domainFilterElement, chatMessages);
  }

  /**
   * Set up domain filter event listeners
   */
  setupDomainFilterEvents() {
    const domainFilterElement = this.components.domainFilter.getElement();
    
    // Listen for domain filter events
    domainFilterElement.addEventListener('domainFilterApplied', (event) => {
      console.log('Domain filter applied:', event.detail.filter);
    });
    
    domainFilterElement.addEventListener('domainFilterCleared', () => {
      console.log('Domain filter cleared');
    });
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const app = new SidebarApp();
  await app.init();
});
