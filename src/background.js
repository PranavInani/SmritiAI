import { pipeline, env } from '@xenova/transformers';
// Import both 'db' and 'addOrUpdatePage' from your db file
import { addOrUpdatePage } from './db';


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

                // 4. Save to DB, but no longer pass the textContent.
                await addOrUpdatePage({
                    url: message.data.url,
                    title: message.data.title,
                    // textContent property is now removed from the object being saved.
                    embedding: embedding.data,
                });

            } catch (error) {
                console.error('Failed to process page data:', error);
            }
        })();
        return; // No response needed for this action
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
});