import { addOrUpdatePage } from '../../db.js';
import { addPageToIndex } from '../../search.js';
import { EmbeddingPipelineSingleton } from '../services/embedding-service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/message-helpers.js';

/**
 * Handles browser history processing requests from the UI
 * @param {Object} message - The message containing time range
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleProcessBrowserHistory(message, sender, sendResponse) {
    try {
        console.log('Processing browser history for AI indexing...');
        
        // Calculate start time based on the selected range
        const now = Date.now();
        let startTime = 0; // Default to all time
        
        if (message.timeRange && message.timeRange !== 'all') {
            const timeRanges = {
                'week': 7 * 24 * 60 * 60 * 1000,        // 7 days
                'month': 30 * 24 * 60 * 60 * 1000,      // 30 days
                '6months': 6 * 30 * 24 * 60 * 60 * 1000, // 6 months (approx)
                'year': 365 * 24 * 60 * 60 * 1000,      // 1 year
                '2years': 2 * 365 * 24 * 60 * 60 * 1000  // 2 years
            };
            
            if (timeRanges[message.timeRange]) {
                startTime = now - timeRanges[message.timeRange];
            }
        }
        
        console.log(`Processing history from: ${message.timeRange || 'all time'}`);
        
        // Query browser history using the history API
        const historyItems = await browser.history.search({
            text: '',           // Empty text returns all history
            maxResults: 100000, // Large number to get as much as possible
            startTime: startTime // From calculated start time
        });

        console.log(`Found ${historyItems.length} history items to process`);
        
        // Start processing in batches
        await processHistoryItemsBatch(historyItems, sendResponse);
        
    } catch (error) {
        console.error('Failed to process browser history:', error);
        browser.runtime.sendMessage({
            type: 'history-processing-error',
            error: error.message
        });
        sendResponse(createErrorResponse(error));
    }
}

/**
 * Process browser history items in batches with progress updates
 * @param {Array} historyItems - Array of history items to process
 * @param {Function} sendResponse - Response callback
 */
async function processHistoryItemsBatch(historyItems, sendResponse) {
    const BATCH_SIZE = 10; // Process 10 items at a time
    let processedCount = 0;
    let successfullyProcessed = 0;
    const totalItems = historyItems.length;

    // Send initial response to confirm we're starting
    sendResponse(createSuccessResponse({ totalItems }));

    try {
        // Load the embedding model
        const extractor = await EmbeddingPipelineSingleton.getInstance();
        
        for (let i = 0; i < historyItems.length; i += BATCH_SIZE) {
            const batch = historyItems.slice(i, i + BATCH_SIZE);
            
            // Process each item in the batch
            for (const item of batch) {
                try {
                    // Skip items without proper title or URL
                    if (!item.url || !item.title || item.title.trim() === '') {
                        processedCount++;
                        continue;
                    }
                    
                    // Skip non-http/https URLs (file://, chrome://, etc.)
                    if (!item.url.startsWith('http://') && !item.url.startsWith('https://')) {
                        processedCount++;
                        continue;
                    }
                    
                    // Check if this URL is already indexed
                    const { db } = await import('../../db.js');
                    const existingPage = await db.pages.where('url').equals(item.url).first();
                    
                    if (existingPage) {
                        processedCount++;
                        continue; // Skip already indexed pages
                    }
                    
                    // Combine title and URL for embedding
                    const textForEmbedding = `${item.title} - ${item.url}`;
                    
                    // Generate embedding
                    const embedding = await extractor(textForEmbedding, { pooling: 'mean', normalize: true });
                    
                    // Save to database using the existing database function
                    const savedPage = await addOrUpdatePage({
                        url: item.url,
                        title: item.title,
                        embedding: embedding.data
                    });
                    
                    if (savedPage) {
                        // Add to search index
                        await addPageToSearchIndex(savedPage);
                        successfullyProcessed++;
                    }
                    
                } catch (error) {
                    console.error(`Failed to process history item: ${item.url}`, error);
                }
                
                processedCount++;
                
                // Send progress update
                browser.runtime.sendMessage({
                    type: 'history-processing-progress',
                    processed: processedCount,
                    total: totalItems
                });
            }
            
            // Small delay between batches to avoid overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Send completion message
        browser.runtime.sendMessage({
            type: 'history-processing-complete',
            processedCount: successfullyProcessed,
            totalCount: totalItems
        });
        
        console.log(`History processing complete: ${successfullyProcessed}/${totalItems} pages indexed`);
        
    } catch (error) {
        console.error('Error during batch processing:', error);
        browser.runtime.sendMessage({
            type: 'history-processing-error',
            error: error.message
        });
    }
}

/**
 * Helper function to add a page to the search index
 * @param {Object} pageData - Page data to add to index
 */
async function addPageToSearchIndex(pageData) {
    try {
        await addPageToIndex(pageData);
    } catch (error) {
        console.error('Failed to add page to search index:', error);
        throw error;
    }
}
