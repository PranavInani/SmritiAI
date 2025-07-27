import { pipeline, env } from '@xenova/transformers';
import { db, addOrUpdatePage } from './db';
import { initSearchIndex, searchPages, addPageToIndex, manualRebuildIndex, getIndexStats, updateSearchSettings, exportAllData, importData, clearAllData, getSearchSettings } from './search';

// Expose the db instance to the global scope for easy debugging from the console
globalThis.db = db;

env.allowLocalModels = false; // Ensure we use the remote -> cache flow

/**
 * Singleton class to manage the AI pipeline.
 * Ensures the model is loaded only once, and lazily.
 */
class EmbeddingPipelineSingleton {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            console.log('Singleton: Pipeline not initialized. Initializing...');
            this.instance = pipeline(this.task, this.model);
        } else {
            console.log('Singleton: Pipeline already initialized.');
        }
        return this.instance;
    }
}

// Initialize the search index when the extension first starts up.
initSearchIndex();

// Listen for messages from other parts of the extension
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'processPageData') {
        (async () => {
            try {
                console.log(`1. Received content for: ${message.data.title}`);
                
                const extractor = await EmbeddingPipelineSingleton.getInstance();
                
                console.log('2. Generating embedding...');
                const embedding = await extractor(message.data.content, { pooling: 'mean', normalize: true });
                console.log('3. Embedding generated successfully.');

                const pageData = {
                    url: message.data.url,
                    title: message.data.title,
                    embedding: embedding.data,
                };

                const savedPage = await addOrUpdatePage(pageData);

                // Add to search index efficiently with the page ID
                if (savedPage && savedPage.id) {
                    await addPageToIndex({
                        ...pageData,
                        id: savedPage.id
                    });
                }

            } catch (error) {
                console.error('Failed to process page data:', error);
            }
        })();
        return;
    }

    if (message.type === 'get-embedding') {
        // Run the pipeline asynchronously
        (async () => {
            // 1. Get the pipeline instance. This will load it if it's the first time.
            const extractor = await EmbeddingPipelineSingleton.getInstance();

            // 2. Generate the embedding
            const output = await extractor(message.text, { pooling: 'mean', normalize: true });

            // 4. Send the result back
            sendResponse({ status: 'complete', output: Array.from(output.data) });
        })();

        // return true to indicate we will send a response asynchronously
        return true;
    }

    // New handler for search requests from the UI
    if (message.action === 'search') {
        (async () => {
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
        })();
        return true; // Indicate an async response
    }

    // New handler for rebuild index requests from the UI
    if (message.action === 'rebuild-index') {
        (async () => {
            try {
                console.log('Rebuilding HNSW index requested from UI...');
                
                // Use the manual rebuild function
                await manualRebuildIndex();
                
                console.log('HNSW index rebuild completed successfully.');
                sendResponse({ success: true });
            } catch (error) {
                console.error('Failed to rebuild HNSW index:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Indicate an async response
    }

    // New handler for index stats requests from the UI
    if (message.action === 'get-index-stats') {
        (async () => {
            try {
                console.log('Index stats requested from UI...');
                
                const stats = await getIndexStats();
                
                console.log('Index stats retrieved successfully.');
                sendResponse({ success: true, stats });
            } catch (error) {
                console.error('Failed to get index stats:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true; // Indicate an async response
    }

    // Handler for updating settings
    if (message.action === 'update-settings') {
        (async () => {
            try {
                console.log('Settings update requested from UI...');
                
                await updateSearchSettings(message.settings);
                
                console.log('Settings updated successfully.');
                sendResponse({ success: true });
            } catch (error) {
                console.error('Failed to update settings:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    // Handler for exporting data
    if (message.action === 'export-data') {
        (async () => {
            try {
                console.log('Data export requested from UI...');
                
                const data = await exportAllData();
                
                console.log('Data exported successfully.');
                sendResponse({ success: true, data });
            } catch (error) {
                console.error('Failed to export data:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    // Handler for importing data
    if (message.action === 'import-data') {
        (async () => {
            try {
                console.log('Data import requested from UI...');
                
                const result = await importData(message.data);
                
                console.log('Data imported successfully.');
                sendResponse({ success: true, imported: result.imported });
            } catch (error) {
                console.error('Failed to import data:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    // Handler for clearing all data
    if (message.action === 'clear-all-data') {
        (async () => {
            try {
                console.log('Clear all data requested from UI...');
                
                await clearAllData();
                
                console.log('All data cleared successfully.');
                sendResponse({ success: true });
            } catch (error) {
                console.error('Failed to clear all data:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    // Process browser history handler
    if (message.action === 'process-browser-history') {
        (async () => {
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
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }
});

// Process browser history items in batches with progress updates
async function processHistoryItemsBatch(historyItems, sendResponse) {
    const BATCH_SIZE = 10; // Process 10 items at a time
    let processedCount = 0;
    let successfullyProcessed = 0;
    const totalItems = historyItems.length;

    // Send initial response to confirm we're starting
    sendResponse({ success: true, totalItems });

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
                    const { db } = await import('./db.js');
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
                    const { addOrUpdatePage } = await import('./db.js');
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

// Helper function to add a page to the search index
async function addPageToSearchIndex(pageData) {
    try {
        const { addPageToIndex } = await import('./search.js');
        await addPageToIndex(pageData);
    } catch (error) {
        console.error('Failed to add page to search index:', error);
        throw error;
    }
}