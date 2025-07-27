import { ThemeManager } from './components/theme-manager.js';
import { ChatInterface } from './components/chat-interface.js';
import { CommandSystem } from './components/command-system.js';
import { SettingsModal } from './components/settings-modal.js';
import { ConfirmationModal } from './components/confirmation-modal.js';
import { HeaderDropdown } from './components/header-dropdown.js';
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
  init() {
    // Initialize core components
    this.initializeComponents();
    
    // Set up component dependencies
    this.setupDependencies();
    
    // Handle first time user experience
    this.handlers.firstTime.checkFirstTimeUser();
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    // Core UI components
    this.components.theme = new ThemeManager();
    this.components.chat = new ChatInterface();
    this.components.confirmationModal = new ConfirmationModal();
    
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
    // Any additional cross-component setup can go here
    // Most dependencies are already handled in constructors
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new SidebarApp();
  app.init();
});
