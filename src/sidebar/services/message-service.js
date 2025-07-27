/**
 * Background script communication service
 */

/**
 * Send a search query to the background script
 * @param {string} query - Search query
 * @param {string} domainFilter - Optional domain filter string
 * @returns {Promise<Array>} Search results
 */
export async function sendSearchQuery(query, domainFilter = null) {
  const message = {
    action: 'search',
    query: query
  };
  
  if (domainFilter) {
    message.domainFilter = domainFilter;
  }
  
  return await browser.runtime.sendMessage(message);
}

/**
 * Get index statistics from background script
 * @returns {Promise<Object>} Index stats response
 */
export async function getIndexStats() {
  return await browser.runtime.sendMessage({
    action: 'get-index-stats'
  });
}

/**
 * Rebuild the search index
 * @returns {Promise<Object>} Rebuild response
 */
export async function rebuildIndex() {
  return await browser.runtime.sendMessage({
    action: 'rebuild-index'
  });
}

/**
 * Update settings in background script
 * @param {Object} settings - Settings to update
 * @returns {Promise<Object>} Update response
 */
export async function updateSettings(settings) {
  return await browser.runtime.sendMessage({
    action: 'update-settings',
    settings: settings
  });
}

/**
 * Process browser history
 * @param {string} timeRange - Time range to process
 * @returns {Promise<Object>} Process response
 */
export async function processBrowserHistory(timeRange) {
  return await browser.runtime.sendMessage({
    action: 'process-browser-history',
    timeRange: timeRange
  });
}

/**
 * Export all data
 * @returns {Promise<Object>} Export response
 */
export async function exportData() {
  return await browser.runtime.sendMessage({
    action: 'export-data'
  });
}

/**
 * Import data
 * @param {Object} data - Data to import
 * @returns {Promise<Object>} Import response
 */
export async function importData(data) {
  return await browser.runtime.sendMessage({
    action: 'import-data',
    data: data
  });
}

/**
 * Clear all data
 * @returns {Promise<Object>} Clear response
 */
export async function clearAllData() {
  return await browser.runtime.sendMessage({
    action: 'clear-all-data'
  });
}

/**
 * Get available domains from indexed pages
 * @returns {Promise<Object>} Available domains response
 */
export async function getAvailableDomains() {
  return await browser.runtime.sendMessage({
    action: 'get-available-domains'
  });
}
