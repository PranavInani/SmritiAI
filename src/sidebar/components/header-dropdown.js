/**
 * Header Dropdown Manager
 */
export class HeaderDropdown {
  constructor(statsHandler, settingsModal, dataHandler) {
    this.statsHandler = statsHandler;
    this.settingsModal = settingsModal;
    this.dataHandler = dataHandler;
    
    this.dropdownToggle = document.getElementById('dropdown-toggle');
    this.dropdownMenu = document.getElementById('dropdown-menu');
    this.isDropdownOpen = false;
    
    this.init();
  }

  /**
   * Initialize header dropdown
   */
  init() {
    // Toggle dropdown on click
    this.dropdownToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.dropdownMenu.contains(e.target) && !this.dropdownToggle.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // Handle dropdown item clicks
    this.dropdownMenu.addEventListener('click', async (e) => {
      const dropdownItem = e.target.closest('.dropdown-item');
      if (!dropdownItem || dropdownItem.classList.contains('disabled')) {
        return;
      }

      const action = dropdownItem.dataset.action;
      
      // Close dropdown after selection
      this.closeDropdown();

      // Handle different actions
      await this.handleAction(action);
    });
  }

  /**
   * Toggle dropdown open/closed
   */
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
    this.dropdownToggle.classList.toggle('open', this.isDropdownOpen);
    this.dropdownMenu.classList.toggle('hidden', !this.isDropdownOpen);
  }

  /**
   * Close dropdown
   */
  closeDropdown() {
    this.isDropdownOpen = false;
    this.dropdownToggle.classList.remove('open');
    this.dropdownMenu.classList.add('hidden');
  }

  /**
   * Handle dropdown action
   * @param {string} action - Action to handle
   */
  async handleAction(action) {
    switch (action) {
      case 'index-stats':
        await this.statsHandler.showStats();
        break;
      case 'settings':
        this.settingsModal.show();
        break;
      case 'export-data':
        await this.dataHandler.handleExportData();
        break;
      case 'import-data':
        this.dataHandler.handleImportData();
        break;
      case 'clear-data':
        this.dataHandler.handleClearData();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
}
