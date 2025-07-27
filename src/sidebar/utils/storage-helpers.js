/**
 * LocalStorage utilities for the sidebar
 */

/**
 * Default settings configuration
 */
export const DEFAULT_SETTINGS = {
  searchResultCount: 5,
  hnswEf: 200,
  hnswM: 16,
  maxElements: 10000,
  autoIndex: true
};

/**
 * Load settings from localStorage
 * @returns {Object} Settings object
 */
export function loadSettings() {
  const saved = localStorage.getItem('smriti-settings');
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings to save
 */
export function saveSettings(settings) {
  localStorage.setItem('smriti-settings', JSON.stringify(settings));
}

/**
 * Get theme from localStorage
 * @returns {string} Theme ('light' or 'dark')
 */
export function getTheme() {
  return localStorage.getItem('sidebar-theme') || 'dark';
}

/**
 * Save theme to localStorage
 * @param {string} theme - Theme to save
 */
export function saveTheme(theme) {
  localStorage.setItem('sidebar-theme', theme);
}

/**
 * Check if this is the first time user
 * @returns {boolean} True if first time
 */
export function isFirstTimeUser() {
  return !localStorage.getItem('smriti-ai-first-time');
}

/**
 * Mark user as not first time
 */
export function markNotFirstTime() {
  localStorage.setItem('smriti-ai-first-time', 'false');
}
