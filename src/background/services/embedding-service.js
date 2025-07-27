import { pipeline, env } from '@xenova/transformers';

// Ensure we use the remote -> cache flow
env.allowLocalModels = false;

/**
 * Singleton class to manage the AI pipeline.
 * Ensures the model is loaded only once, and lazily.
 */
export class EmbeddingPipelineSingleton {
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
