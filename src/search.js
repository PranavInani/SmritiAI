import { db } from './db';
import { loadHnswlib } from 'hnswlib-wasm/dist/hnswlib.js';

// Global HNSW index instance
let hnswIndex = null;
let hnswLib = null;
let isIndexInitialized = false;

// Configuration for HNSW
const HNSW_CONFIG = {
  dimension: 384, // all-MiniLM-L6-v2 embedding dimension
  maxElements: 10000, // Maximum number of pages we can index
  ef: 200, // ef parameter for search quality
  M: 16, // M parameter for construction
  metric: 'cosine' // Use cosine distance for semantic similarity
};

/**
 * Initializes the HNSW search index.
 * Loads the HNSW library and creates/loads the index with existing data.
 */
export async function initSearchIndex() {
  try {
    console.log('Loading HNSW library...');
    hnswLib = await loadHnswlib();
    
    console.log('Initializing HNSW index...');
    // Based on TypeScript definitions, HierarchicalNSW expects 3 parameters
    hnswIndex = new hnswLib.HierarchicalNSW(HNSW_CONFIG.metric, HNSW_CONFIG.dimension, '');
    // initIndex expects 4 parameters: maxElements, m, efConstruction, randomSeed
    hnswIndex.initIndex(HNSW_CONFIG.maxElements, HNSW_CONFIG.M, HNSW_CONFIG.ef, 100);
    
    // Load existing pages into the index
    await rebuildIndex();
    
    isIndexInitialized = true;
    console.log('HNSW search index initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize HNSW index:', error);
    throw error;
  }
}

/**
 * Rebuilds the HNSW index from all pages in the database.
 * This is called during initialization to populate the index with existing data.
 */
async function rebuildIndex() {
  try {
    const pages = await db.pages.toArray();
    console.log(`Rebuilding HNSW index with ${pages.length} existing pages...`);
    
    for (const page of pages) {
      if (page.embedding && page.embedding.length === HNSW_CONFIG.dimension) {
        const embedding = new Float32Array(page.embedding);
        hnswIndex.addPoint(embedding, page.id, false);
      }
    }
    
    console.log('HNSW index rebuilt successfully.');
  } catch (error) {
    console.error('Failed to rebuild HNSW index:', error);
  }
}

/**
 * Searches for the k most similar pages using HNSW.
 */
export async function searchPages(queryEmbedding, k = 5) {
  if (!isIndexInitialized || !hnswIndex) {
    console.warn('HNSW index not initialized. Falling back to database search...');
    return await fallbackSearch(queryEmbedding, k);
  }

  try {
    console.log('Searching pages using HNSW...');
    
    // Convert query embedding to Float32Array if it isn't already
    const queryVector = queryEmbedding instanceof Float32Array 
      ? queryEmbedding 
      : new Float32Array(queryEmbedding);
    
    // Search the HNSW index
    const searchResult = hnswIndex.searchKnn(queryVector, k);
    
    if (!searchResult.neighbors || searchResult.neighbors.length === 0) {
      console.log('No results found in HNSW search.');
      return [];
    }
    
    // Get the actual page data from the database using the IDs
    const pageIds = searchResult.neighbors;
    const pages = await db.pages.where('id').anyOf(pageIds).toArray();
    
    // Sort pages by the order they appeared in search results
    const sortedPages = pageIds.map(id => pages.find(page => page.id === id))
                              .filter(page => page !== undefined);
    
    console.log(`Found ${sortedPages.length} similar pages using HNSW.`);
    console.log('Search distances:', searchResult.distances);
    
    return sortedPages;
  } catch (error) {
    console.error('HNSW search failed:', error);
    console.log('Falling back to database search...');
    return await fallbackSearch(queryEmbedding, k);
  }
}

/**
 * Fallback search function using simple cosine similarity.
 * Used when HNSW index is not available or fails.
 */
async function fallbackSearch(queryEmbedding, k = 5) {
  console.log('Using fallback cosine similarity search...');
  
  const pages = await db.pages.toArray();
  
  if (pages.length === 0) {
    console.log('No pages found in database.');
    return [];
  }

  // Calculate cosine similarity for each page
  const similarities = pages.map(page => ({
    page,
    similarity: cosineSimilarity(queryEmbedding, page.embedding)
  }));

  // Sort by similarity (highest first) and take top k results
  const results = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
    .map(result => result.page);

  console.log(`Found ${results.length} similar pages using cosine similarity.`);
  return results;
}

/**
 * Calculates cosine similarity between two vectors (fallback function)
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Adds a new page to the HNSW search index.
 */
export async function addPageToIndex(pageData) {
  if (!isIndexInitialized || !hnswIndex) {
    console.warn('HNSW index not initialized. Page will be indexed on next restart.');
    return;
  }

  try {
    if (!pageData.embedding || pageData.embedding.length !== HNSW_CONFIG.dimension) {
      console.error('Invalid embedding data for page:', pageData.title);
      return;
    }

    const embedding = new Float32Array(pageData.embedding);
    hnswIndex.addPoint(embedding, pageData.id, false);
    
    console.log(`Page "${pageData.title}" added to HNSW index.`);
  } catch (error) {
    console.error('Failed to add page to HNSW index:', error);
  }
}
