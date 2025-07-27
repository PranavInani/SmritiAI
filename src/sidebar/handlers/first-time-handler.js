import { isFirstTimeUser, markNotFirstTime } from '../utils/storage-helpers.js';

/**
 * First Time User Experience Handler
 */
export class FirstTimeHandler {
  constructor(chatInterface, settingsModal) {
    this.chatInterface = chatInterface;
    this.settingsModal = settingsModal;
  }

  /**
   * Check and handle first time user experience
   */
  checkFirstTimeUser() {
    try {
      if (isFirstTimeUser()) {
        markNotFirstTime();
        this.showFirstTimeWelcome();
      }
    } catch (error) {
      console.error('Error checking first-time user:', error);
    }
  }

  /**
   * Show first time welcome message
   */
  showFirstTimeWelcome() {
    const welcomeMessage = this.chatInterface.showFirstTimeWelcome();
    
    // Add event listeners for welcome actions
    document.getElementById('welcome-process-history').addEventListener('click', () => {
      // Open settings modal and focus on history processing
      this.settingsModal.show();
      
      // Scroll to the history processing section
      setTimeout(() => {
        const historySection = document.querySelector('#process-history-btn').closest('.settings-section');
        if (historySection) {
          historySection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      welcomeMessage.remove();
    });
    
    document.getElementById('welcome-skip').addEventListener('click', () => {
      welcomeMessage.remove();
      this.chatInterface.addMessage(
        'Got it! You can process your browser history anytime from the settings menu. Try searching for something or type "/" for commands.', 
        'received'
      );
    });
  }
}
