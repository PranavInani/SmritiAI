import { addOrUpdatePage } from '../../db.js';
import { addPageToIndex } from '../../search.js';
import { EmbeddingPipelineSingleton } from '../services/embedding-service.js';

/**
 * Handles processing page data from content scripts
 * @param {Object} message - The message containing page data
 * @param {Object} sender - Message sender info
 * @param {Function} sendResponse - Response callback
 */
export async function handleProcessPageData(message, sender, sendResponse) {
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
        throw error;
    }
}
