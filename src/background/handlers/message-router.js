import { createAsyncHandler } from '../utils/message-helpers.js';
import { handleProcessPageData } from './page-processor.js';
import { handleSearch, handleGetEmbedding, handleRebuildIndex, handleGetIndexStats, handleGetAvailableDomains } from './search-handler.js';
import { handleUpdateSettings } from './settings-handler.js';
import { handleExportData, handleImportData, handleClearAllData } from './data-handler.js';
import { handleProcessBrowserHistory } from './history-processor.js';

/**
 * Message router that delegates messages to appropriate handlers
 */
export class MessageRouter {
    constructor() {
        this.handlers = new Map();
        this.setupHandlers();
    }

    /**
     * Set up all message handlers
     */
    setupHandlers() {
        // Page processing
        this.handlers.set('processPageData', handleProcessPageData);
        
        // Search operations
        this.handlers.set('search', handleSearch);
        this.handlers.set('get-embedding', handleGetEmbedding);  // Note: message.type for this one
        this.handlers.set('rebuild-index', handleRebuildIndex);
        this.handlers.set('get-index-stats', handleGetIndexStats);
        this.handlers.set('get-available-domains', handleGetAvailableDomains);
        
        // Settings
        this.handlers.set('update-settings', handleUpdateSettings);
        
        // Data operations
        this.handlers.set('export-data', handleExportData);
        this.handlers.set('import-data', handleImportData);
        this.handlers.set('clear-all-data', handleClearAllData);
        
        // History processing
        this.handlers.set('process-browser-history', handleProcessBrowserHistory);
    }

    /**
     * Route a message to the appropriate handler
     * @param {Object} message - The message to route
     * @param {Object} sender - Message sender info
     * @param {Function} sendResponse - Response callback
     * @returns {boolean} Whether the handler will send an async response
     */
    route(message, sender, sendResponse) {
        // Determine the action key (handle both message.action and message.type)
        const actionKey = message.action || message.type;
        
        if (!actionKey) {
            console.warn('Message received without action or type:', message);
            return false;
        }

        const handler = this.handlers.get(actionKey);
        
        if (!handler) {
            console.warn(`No handler found for action: ${actionKey}`);
            return false;
        }

        // Special case for 'get-embedding' which doesn't return a promise in original code
        if (actionKey === 'get-embedding') {
            const asyncHandler = createAsyncHandler(handler);
            return asyncHandler(message, sender, sendResponse);
        }

        // For processPageData, the original code doesn't send a response
        if (actionKey === 'processPageData') {
            handler(message, sender, sendResponse).catch(error => {
                console.error('Failed to process page data:', error);
            });
            return false; // Don't wait for response
        }

        // For all other handlers, wrap in async handler
        const asyncHandler = createAsyncHandler(handler);
        return asyncHandler(message, sender, sendResponse);
    }
}
