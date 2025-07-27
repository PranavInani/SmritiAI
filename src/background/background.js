import { db } from '../db.js';
import { initSearchIndex } from '../search.js';
import { MessageRouter } from './handlers/message-router.js';

// Expose the db instance to the global scope for easy debugging from the console
globalThis.db = db;

// Initialize the search index when the extension first starts up
initSearchIndex();

// Create message router instance
const messageRouter = new MessageRouter();

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    return messageRouter.route(message, sender, sendResponse);
});
