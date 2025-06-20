import { pipeline, env } from '@xenova/transformers';

// For stability in the extension environment.
env.backends.onnx.wasm.numThreads = 1;
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

// Listen for messages from the sidebar
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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