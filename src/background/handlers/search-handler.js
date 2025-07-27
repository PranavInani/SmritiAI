import { searchPages, getIndexStats, manualRebuildIndex, getSearchSettings } from '../../search.js';
import { EmbeddingPipelineSingleton } from '../services/embedding-service.js';
import { createSuccessResponse, createErrorResponse } from '../utils/message-helpers.js';
import { applyDomainFilter, getUniqueDomains } from '../utils/domain-filter.js';
import { db } from '../../db.js';

/**
 * Handles search requests from the UI
 * @param {Object} message - The message containing search query and optional domain filter
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleSearch(message, sender, sendResponse) {
    console.log(`Searching for: "${message.query}"`);
    if (message.domainFilter) {
        console.log(`Domain filter applied: "${message.domainFilter}"`);
    } else {
        console.log('No domain filter applied');
    }
    
    const extractor = await EmbeddingPipelineSingleton.getInstance();
    
    // 1. Generate an embedding for the user's query
    const queryEmbedding = await extractor(message.query, { pooling: 'mean', normalize: true });
    console.log(`Query embedding generated, length: ${queryEmbedding.data.length}`);

    // 2. Use our search function to find the top results
    const settings = getSearchSettings();
    let resultCount = settings?.searchResultCount || 5;
    
    // If domain filtering is applied, search for more results to account for filtering
    if (message.domainFilter) {
        resultCount = Math.max(resultCount * 3, 15); // Get 3x more results for filtering
    }
    
    const results = await searchPages(queryEmbedding.data, resultCount);
    
    // 3. Apply domain filtering if specified
    let filteredResults = results;
    if (message.domainFilter) {
        filteredResults = applyDomainFilter(results, message.domainFilter);
        // Limit to the original requested count after filtering
        const originalCount = settings?.searchResultCount || 5;
        filteredResults = filteredResults.slice(0, originalCount);
        console.log(`Domain filtering: ${results.length} -> ${filteredResults.length} results`);
    }
    
    console.log(`Search results found: ${filteredResults.length} pages`);
    console.log("Search results:", filteredResults);
    
    // 4. Send the results back to the UI
    sendResponse(filteredResults);
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
 * Handles requests to get available domains from indexed pages
 * @param {Object} message - The message
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleGetAvailableDomains(message, sender, sendResponse) {
    try {
        console.log('Getting available domains from indexed pages...');
        
        // Get all pages from the database
        const pages = await db.pages.toArray();
        
        // Extract unique domains
        const domains = getUniqueDomains(pages);
        
        console.log(`Found ${domains.length} unique domains`);
        sendResponse(createSuccessResponse({ domains }));
    } catch (error) {
        console.error('Failed to get available domains:', error);
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
