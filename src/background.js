import { pipeline, env } from '@xenova/transformers';
import { db, addOrUpdatePage } from './db';
import { initSearchIndex, searchPages, addPageToIndex, manualRebuildIndex, getIndexStats } from './search';

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

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            console.log('Singleton: Pipeline not initialized. Initializing...');
            this.instance = pipeline(this.task, this.model, { progress_callback });
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
            const extractor = await EmbeddingPipelineSingleton.getInstance((progress) => {
                // 2. Send progress updates back to the sidebar
                browser.runtime.sendMessage({ type: 'model-progress', payload: progress });
            });

            // 3. Generate the embedding
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
            const results = await searchPages(queryEmbedding.data, 5);
            
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
});