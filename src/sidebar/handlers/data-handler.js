import { exportData, importData, clearAllData } from '../services/message-service.js';
import { createStatusIndicator } from '../utils/dom-helpers.js';

/**
 * Data Operations Handler (Export, Import, Clear)
 */
export class DataHandler {
  constructor(chatInterface, confirmationModal) {
    this.chatInterface = chatInterface;
    this.confirmationModal = confirmationModal;
    this.importFileInput = document.getElementById('import-file-input');
    
    this.init();
  }

  /**
   * Initialize data handler
   */
  init() {
    // Set up import file handler
    this.importFileInput.addEventListener('change', async (event) => {
      await this.handleImportFile(event);
    });
  }

  /**
   * Handle data export
   */
  async handleExportData() {
    try {
      const exportStatus = document.getElementById('export-status');
      exportStatus.innerHTML = '<span class="spinner"></span>';

      const response = await exportData();

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
        this.setExportError();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      this.setExportError();
    }
  }

  /**
   * Set export error state
   */
  setExportError() {
    const exportStatus = document.getElementById('export-status');
    exportStatus.innerHTML = '<span class="error-text">✗</span>';
    setTimeout(() => exportStatus.textContent = '', 3000);
  }

  /**
   * Handle data import (trigger file picker)
   */
  handleImportData() {
    this.importFileInput.click();
  }

  /**
   * Handle import file selection
   * @param {Event} event - File input change event
   */
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importStatus = document.getElementById('import-status');
      importStatus.innerHTML = '<span class="spinner"></span>';

      const text = await file.text();
      const data = JSON.parse(text);

      const response = await importData(data);

      if (response && response.success) {
        importStatus.innerHTML = '<span class="success-text">✓</span>';
        this.chatInterface.addMessage(`Successfully imported ${response.imported} pages!`, 'received');
        setTimeout(() => importStatus.textContent = '', 2000);
      } else {
        this.setImportError();
      }
    } catch (error) {
      console.error('Error importing data:', error);
      this.setImportError();
    }

    // Reset file input
    event.target.value = '';
  }

  /**
   * Set import error state
   */
  setImportError() {
    const importStatus = document.getElementById('import-status');
    importStatus.innerHTML = '<span class="error-text">✗</span>';
    setTimeout(() => importStatus.textContent = '', 3000);
  }

  /**
   * Handle clear all data
   */
  handleClearData() {
    this.confirmationModal.show(
      'Clear All Data',
      'This will permanently delete all saved pages, embeddings, and search index. This action cannot be undone. Are you sure?',
      async () => {
        try {
          const clearStatus = document.getElementById('clear-status');
          clearStatus.innerHTML = '<span class="spinner"></span>';

          const response = await clearAllData();

          if (response && response.success) {
            clearStatus.innerHTML = '<span class="success-text">✓</span>';
            this.chatInterface.addMessage('All data has been cleared successfully.', 'received');
            setTimeout(() => clearStatus.textContent = '', 2000);
          } else {
            this.setClearError();
          }
        } catch (error) {
          console.error('Error clearing data:', error);
          this.setClearError();
        }
      }
    );
  }

  /**
   * Set clear error state
   */
  setClearError() {
    const clearStatus = document.getElementById('clear-status');
    clearStatus.innerHTML = '<span class="error-text">✗</span>';
    setTimeout(() => clearStatus.textContent = '', 3000);
  }
}
