/**
 * Confirmation Modal Manager
 */
export class ConfirmationModal {
  constructor() {
    this.confirmationModal = document.getElementById('confirmation-modal');
    this.closeConfirm = document.getElementById('close-confirm');
    this.confirmYes = document.getElementById('confirm-yes');
    this.confirmNo = document.getElementById('confirm-no');
    this.confirmTitle = document.getElementById('confirm-title');
    this.confirmMessage = document.getElementById('confirm-message');
    
    this.init();
  }

  /**
   * Initialize confirmation modal
   */
  init() {
    // Close modal event listeners
    this.closeConfirm.addEventListener('click', () => this.hide());
    this.confirmNo.addEventListener('click', () => this.hide());
    
    // Close modal when clicking outside
    this.confirmationModal.addEventListener('click', (e) => {
      if (e.target === this.confirmationModal) {
        this.hide();
      }
    });
  }

  /**
   * Show confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Confirmation message
   * @param {Function} onConfirm - Callback for confirmation
   */
  show(title, message, onConfirm) {
    this.confirmTitle.textContent = title;
    this.confirmMessage.textContent = message;
    this.confirmationModal.classList.remove('hidden');
    
    // Remove any existing listeners and add new one
    const newConfirmYes = this.confirmYes.cloneNode(true);
    this.confirmYes.parentNode.replaceChild(newConfirmYes, this.confirmYes);
    this.confirmYes = newConfirmYes;
    
    this.confirmYes.addEventListener('click', () => {
      this.hide();
      onConfirm();
    });
  }

  /**
   * Hide confirmation modal
   */
  hide() {
    this.confirmationModal.classList.add('hidden');
  }
}
