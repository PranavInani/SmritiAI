/**
 * Utility functions for handling browser extension messages
 */

/**
 * Creates an async message handler wrapper
 * @param {Function} handler - The async handler function
 * @returns {Function} Wrapped handler that properly handles async responses
 */
export function createAsyncHandler(handler) {
    return (message, sender, sendResponse) => {
        handler(message, sender, sendResponse)
            .catch(error => {
                console.error('Handler error:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Indicate async response
    };
}

/**
 * Creates a success response
 * @param {any} data - Response data
 * @returns {Object} Success response object
 */
export function createSuccessResponse(data = {}) {
    return { success: true, ...data };
}

/**
 * Creates an error response
 * @param {string|Error} error - Error message or Error object
 * @returns {Object} Error response object
 */
export function createErrorResponse(error) {
    const message = error instanceof Error ? error.message : error;
    return { success: false, error: message };
}
