import { updateSearchSettings } from '../../search.js';
import { createSuccessResponse, createErrorResponse } from '../utils/message-helpers.js';

/**
 * Handles settings update requests from the UI
 * @param {Object} message - The message containing settings
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleUpdateSettings(message, sender, sendResponse) {
    try {
        console.log('Settings update requested from UI...');
        
        await updateSearchSettings(message.settings);
        
        console.log('Settings updated successfully.');
        sendResponse(createSuccessResponse());
    } catch (error) {
        console.error('Failed to update settings:', error);
        sendResponse(createErrorResponse(error));
    }
}
