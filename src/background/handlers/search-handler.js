import { searchPages, getIndexStats, manualRebuildIndex, getSearchSettings } from '../../search.js';
import { EmbeddingPipelineSingleton } from '../services/embedding-service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/message-helpers.js';

/**
 * Handles search requests from the UI
 * @param {Object} message - The message containing search query
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleSearch(message, sender, sendResponse) {
    console.log(`Searching for: "${message.query}"`);
    const extractor = await EmbeddingPipelineSingleton.getInstance();
    
    // 1. Generate an embedding for the user's query
    const queryEmbedding = await extractor(message.query, { pooling: 'mean', normalize: true });
    console.log(`Query embedding generated, length: ${queryEmbedding.data.length}`);

    // 2. Use our search function to find the top results
    const settings = getSearchSettings();
    const resultCount = settings?.searchResultCount || 5;
    const results = await searchPages(queryEmbedding.data, resultCount);
    
    console.log(`Search results found: ${results.length} pages`);
    console.log("Search results:", results);
    
    // 3. Send the results back to the UI
    sendResponse(results);
}

/**
 * Handles get embedding requests (for testing/debugging)
 * @param {Object} message - The message containing text to embed
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleGetEmbedding(message, sender, sendResponse) {
    // 1. Get the pipeline instance. This will load it if it's the first time.
    const extractor = await EmbeddingPipelineSingleton.getInstance();

    // 2. Generate the embedding
    const output = await extractor(message.text, { pooling: 'mean', normalize: true });

    // 3. Send the result back
    sendResponse({ status: 'complete', output: Array.from(output.data) });
}

/**
 * Handles rebuild index requests from the UI
 * @param {Object} message - The message
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleRebuildIndex(message, sender, sendResponse) {
    try {
        console.log('Rebuilding HNSW index requested from UI...');
        
        // Use the manual rebuild function
        await manualRebuildIndex();
        
        console.log('HNSW index rebuild completed successfully.');
        sendResponse(createSuccessResponse());
    } catch (error) {
        console.error('Failed to rebuild HNSW index:', error);
        sendResponse(createErrorResponse(error));
    }
}

/**
 * Handles index stats requests from the UI
 * @param {Object} message - The message
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleGetIndexStats(message, sender, sendResponse) {
    try {
        console.log('Index stats requested from UI...');
        
        const stats = await getIndexStats();
        
        console.log('Index stats retrieved successfully.');
        sendResponse(createSuccessResponse({ stats }));
    } catch (error) {
        console.error('Failed to get index stats:', error);
        sendResponse(createErrorResponse(error));
    }
}
