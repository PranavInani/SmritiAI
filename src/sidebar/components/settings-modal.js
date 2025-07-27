import { loadSettings, saveSettings, DEFAULT_SETTINGS } from '../utils/storage-helpers.js';
import { updateSettings as updateBackgroundSettings, rebuildIndex, processBrowserHistory } from '../services/message-service.js';
import { setButtonState, createStatusIndicator } from '../utils/dom-helpers.js';

/**
 * Settings Modal Manager
 */
export class SettingsModal {
  constructor(chatInterface) {
    this.chatInterface = chatInterface;
    this.currentSettings = loadSettings();
    
    // DOM elements
    this.settingsModal = document.getElementById('settings-modal');
    this.closeSettings = document.getElementById('close-settings');
    this.saveSettings = document.getElementById('save-settings');
    this.resetSettings = document.getElementById('reset-settings');
    
    // Rebuild index elements
    this.rebuildIndexBtn = document.getElementById('rebuild-index-btn');
    this.rebuildIndexText = document.getElementById('rebuild-index-text');
    this.rebuildIndexSpinner = document.getElementById('rebuild-index-spinner');
    
    // History processing elements
    this.processHistoryBtn = document.getElementById('process-history-btn');
    this.processHistoryText = document.getElementById('process-history-text');
    this.processHistorySpinner = document.getElementById('process-history-spinner');
    this.historyTimeRange = document.getElementById('history-time-range');
    this.historyProgressContainer = document.getElementById('history-progress-container');
    this.historyProgressFill = document.getElementById('history-progress-fill');
    this.historyProgressText = document.getElementById('history-progress-text');
    
    this.init();
  }

  /**
   * Initialize settings modal
   */
  init() {
    this.updateSettingsUI();
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Modal controls
    this.closeSettings.addEventListener('click', () => this.hide());
    this.saveSettings.addEventListener('click', () => this.handleSaveSettings());
    this.resetSettings.addEventListener('click', () => this.handleResetSettings());
    
    // Action buttons
    this.rebuildIndexBtn.addEventListener('click', () => this.handleRebuildIndex());
    this.processHistoryBtn.addEventListener('click', () => this.handleProcessHistory());
    
    // Close modal when clicking outside
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.hide();
      }
    });
  }

  /**
   * Show the settings modal
   */
  show() {
    this.updateSettingsUI();
    this.settingsModal.classList.remove('hidden');
  }

  /**
   * Hide the settings modal
   */
  hide() {
    this.settingsModal.classList.add('hidden');
  }

  /**
   * Update the settings UI with current values
   */
  updateSettingsUI() {
    document.getElementById('search-result-count').value = this.currentSettings.searchResultCount;
    document.getElementById('hnsw-ef').value = this.currentSettings.hnswEf;
    document.getElementById('hnsw-m').value = this.currentSettings.hnswM;
    document.getElementById('max-elements').value = this.currentSettings.maxElements;
    document.getElementById('auto-index').checked = this.currentSettings.autoIndex;
  }

  /**
   * Handle save settings
   */
  async handleSaveSettings() {
    // Get values from form
    this.currentSettings.searchResultCount = parseInt(document.getElementById('search-result-count').value);
    this.currentSettings.hnswEf = parseInt(document.getElementById('hnsw-ef').value);
    this.currentSettings.hnswM = parseInt(document.getElementById('hnsw-m').value);
    this.currentSettings.maxElements = parseInt(document.getElementById('max-elements').value);
    this.currentSettings.autoIndex = document.getElementById('auto-index').checked;
    
    // Save to localStorage
    saveSettings(this.currentSettings);
    
    // Send updated settings to background script
    try {
      await updateBackgroundSettings(this.currentSettings);
      this.hide();
      this.chatInterface.addMessage('Settings saved successfully!', 'received');
    } catch (error) {
      console.error('Error saving settings:', error);
      this.chatInterface.addMessage('Error saving settings. See console for details.', 'received');
    }
  }

  /**
   * Handle reset settings
   */
  handleResetSettings() {
    if (this.confirmationModal) {
      this.confirmationModal.show(
        'Reset Settings',
        'This will reset all settings to their default values. Continue?',
        () => {
          this.currentSettings = { ...DEFAULT_SETTINGS };
          saveSettings(this.currentSettings);
          this.updateSettingsUI();
          this.chatInterface.addMessage('Settings reset to defaults.', 'received');
        }
      );
    }
  }

  /**
   * Handle rebuild index
   */
  async handleRebuildIndex() {
    try {
      setButtonState(
        this.rebuildIndexBtn, 
        this.rebuildIndexText, 
        this.rebuildIndexSpinner,
        { text: 'Rebuilding...', disabled: true, loading: true }
      );

      const response = await rebuildIndex();

      if (response && response.success) {
        setButtonState(
          this.rebuildIndexBtn, 
          this.rebuildIndexText, 
          this.rebuildIndexSpinner,
          { text: 'Rebuild Complete!', disabled: false, loading: false }
        );
        
        setTimeout(() => {
          setButtonState(
            this.rebuildIndexBtn, 
            this.rebuildIndexText, 
            this.rebuildIndexSpinner,
            { text: 'Rebuild Index', disabled: false, loading: false }
          );
        }, 2000);
      } else {
        this.handleRebuildError();
      }
    } catch (error) {
      console.error('Error rebuilding index:', error);
      this.handleRebuildError();
    }
  }

  /**
   * Handle rebuild error state
   */
  handleRebuildError() {
    setButtonState(
      this.rebuildIndexBtn, 
      this.rebuildIndexText, 
      this.rebuildIndexSpinner,
      { text: 'Rebuild Failed', disabled: false, loading: false }
    );
    
    setTimeout(() => {
      setButtonState(
        this.rebuildIndexBtn, 
        this.rebuildIndexText, 
        this.rebuildIndexSpinner,
        { text: 'Rebuild Index', disabled: false, loading: false }
      );
    }, 3000);
  }

  /**
   * Handle process browser history
   */
  async handleProcessHistory() {
    try {
      // Set initial state
      setButtonState(
        this.processHistoryBtn,
        this.processHistoryText,
        this.processHistorySpinner,
        { text: 'Processing...', disabled: true, loading: true }
      );
      
      this.historyProgressContainer.style.display = 'block';
      this.historyProgressFill.style.width = '0%';
      this.historyProgressText.textContent = 'Fetching browser history...';

      const timeRange = this.historyTimeRange.value;
      const response = await processBrowserHistory(timeRange);

      if (response && response.success) {
        this.setupHistoryProgressListener();
      } else {
        this.handleHistoryError('Processing Failed');
      }
    } catch (error) {
      console.error('Error processing browser history:', error);
      this.handleHistoryError('Processing Error');
    }
  }

  /**
   * Set up progress listener for history processing
   */
  setupHistoryProgressListener() {
    const progressListener = (message) => {
      if (message.type === 'history-processing-progress') {
        const progress = Math.round((message.processed / message.total) * 100);
        this.historyProgressFill.style.width = `${progress}%`;
        this.historyProgressText.textContent = `Processing ${message.processed}/${message.total} pages (${progress}%)`;
      } else if (message.type === 'history-processing-complete') {
        browser.runtime.onMessage.removeListener(progressListener);
        
        setButtonState(
          this.processHistoryBtn,
          this.processHistoryText,
          this.processHistorySpinner,
          { text: `Processing Complete! (${message.processedCount} pages indexed)`, disabled: false, loading: false }
        );
        
        this.historyProgressFill.style.width = '100%';
        this.historyProgressText.textContent = `Successfully processed ${message.processedCount} pages from your browser history`;
        
        setTimeout(() => {
          setButtonState(
            this.processHistoryBtn,
            this.processHistoryText,
            this.processHistorySpinner,
            { text: 'Process Browser History', disabled: false, loading: false }
          );
          this.historyProgressContainer.style.display = 'none';
        }, 5000);
      } else if (message.type === 'history-processing-error') {
        browser.runtime.onMessage.removeListener(progressListener);
        this.handleHistoryError('Processing Failed', message.error);
      }
    };

    browser.runtime.onMessage.addListener(progressListener);
  }

  /**
   * Handle history processing error
   * @param {string} errorText - Error text to display
   * @param {string} errorDetail - Detailed error message
   */
  handleHistoryError(errorText, errorDetail = null) {
    setButtonState(
      this.processHistoryBtn,
      this.processHistoryText,
      this.processHistorySpinner,
      { text: errorText, disabled: false, loading: false }
    );
    
    if (errorDetail) {
      this.historyProgressText.textContent = errorDetail;
    }
    
    setTimeout(() => {
      setButtonState(
        this.processHistoryBtn,
        this.processHistoryText,
        this.processHistorySpinner,
        { text: 'Process Browser History', disabled: false, loading: false }
      );
      this.historyProgressContainer.style.display = 'none';
    }, 5000);
  }

  /**
   * Set confirmation modal reference (for dependency injection)
   * @param {ConfirmationModal} confirmationModal - Confirmation modal instance
   */
  setConfirmationModal(confirmationModal) {
    this.confirmationModal = confirmationModal;
  }
}
