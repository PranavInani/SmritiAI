import { getTheme, saveTheme } from '../utils/storage-helpers.js';

/**
 * Theme Manager for the sidebar
 */
export class ThemeManager {
  constructor() {
    this.body = document.body;
    this.themeToggleButton = document.getElementById('theme-toggle-btn');
    this.init();
  }

  /**
   * Initialize theme manager
   */
  init() {
    // Apply saved theme
    const savedTheme = getTheme();
    this.applyTheme(savedTheme);

    // Set up event listener
    this.themeToggleButton.addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  /**
   * Apply a theme
   * @param {string} theme - Theme to apply ('light' or 'dark')
   */
  applyTheme(theme) {
    if (theme === 'dark') {
      this.body.classList.add('dark-mode');
      this.themeToggleButton.textContent = '🌙';
    } else {
      this.body.classList.remove('dark-mode');
      this.themeToggleButton.textContent = '☀️';
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const isDarkMode = this.body.classList.contains('dark-mode');
    const newTheme = isDarkMode ? 'light' : 'dark';
    this.applyTheme(newTheme);
    saveTheme(newTheme);
  }

  /**
   * Get current theme
   * @returns {string} Current theme
   */
  getCurrentTheme() {
    return this.body.classList.contains('dark-mode') ? 'dark' : 'light';
  }
}
