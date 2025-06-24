import { db } from './db';
import { loadHnswlib } from 'hnswlib-wasm/dist/hnswlib.js';

// Global HNSW index instance
let hnswIndex = null;
let hnswLib = null;
let isIndexInitialized = false;

// Configuration for HNSW
let HNSW_CONFIG = {
  dimension: 384, // all-MiniLM-L6-v2 embedding dimension
  maxElements: 10000, // Maximum number of pages we can index
  ef: 200, // ef parameter for search quality
  M: 16, // M parameter for construction
  metric: 'cosine' // Use cosine distance for semantic similarity
};

// Search settings
let searchSettings = {
  searchResultCount: 5,
  autoIndex: true
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
    const searchResult = hnswIndex.searchKnn(queryVector, k, undefined);
    
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

/**
 * Manually rebuilds the HNSW index.
 * This is exposed for UI-triggered rebuilds.
 */
export async function manualRebuildIndex() {
  return await initSearchIndex();
}

/**
 * Updates search settings and applies them.
 */
export async function updateSearchSettings(newSettings) {
  try {
    // Update HNSW configuration
    if (newSettings.hnswEf) HNSW_CONFIG.ef = newSettings.hnswEf;
    if (newSettings.hnswM) HNSW_CONFIG.M = newSettings.hnswM;
    if (newSettings.maxElements) HNSW_CONFIG.maxElements = newSettings.maxElements;
    
    // Update search settings
    if (newSettings.searchResultCount) searchSettings.searchResultCount = newSettings.searchResultCount;
    if (typeof newSettings.autoIndex === 'boolean') searchSettings.autoIndex = newSettings.autoIndex;
    
    console.log('Search settings updated:', { HNSW_CONFIG, searchSettings });
    
    // Note: HNSW parameters only take effect after a rebuild
    return true;
  } catch (error) {
    console.error('Error updating search settings:', error);
    throw error;
  }
}

/**
 * Gets current search settings.
 */
export function getSearchSettings() {
  return searchSettings;
}

/**
 * Exports all data from the database.
 */
export async function exportAllData() {
  try {
    const pages = await db.pages.toArray();
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: {
        ...HNSW_CONFIG,
        ...searchSettings
      },
      pages: pages.map(page => ({
        id: page.id,
        url: page.url,
        title: page.title,
        timestamp: page.timestamp,
        embedding: Array.from(page.embedding) // Convert Float32Array to regular array
      }))
    };
    
    console.log(`Exported ${pages.length} pages`);
    return exportData;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

/**
 * Imports data into the database.
 */
export async function importData(importData) {
  try {
    if (!importData.pages || !Array.isArray(importData.pages)) {
      throw new Error('Invalid import data format');
    }
    
    let imported = 0;
    let skipped = 0;
    
    for (const pageData of importData.pages) {
      try {
        // Convert array back to Float32Array
        const embedding = new Float32Array(pageData.embedding);
        
        // Check if page already exists
        const existing = await db.pages.where('url').equals(pageData.url).first();
        
        if (!existing) {
          await db.pages.add({
            url: pageData.url,
            title: pageData.title,
            timestamp: pageData.timestamp || new Date().toISOString(),
            embedding: embedding
          });
          imported++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.warn('Failed to import page:', pageData.url, error);
        skipped++;
      }
    }
    
    console.log(`Import completed: ${imported} imported, ${skipped} skipped`);
    
    // Trigger a rebuild if we imported data
    if (imported > 0) {
      await manualRebuildIndex();
    }
    
    return { imported, skipped };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
}

/**
 * Clears all data from the database and resets the index.
 */
export async function clearAllData() {
  try {
    // Clear the database
    await db.pages.clear();
    
    // Reset the HNSW index
    if (hnswIndex && hnswLib) {
      hnswIndex = new hnswLib.HierarchicalNSW(HNSW_CONFIG.metric, HNSW_CONFIG.dimension, '');
      hnswIndex.initIndex(HNSW_CONFIG.maxElements, HNSW_CONFIG.M, HNSW_CONFIG.ef, 100);
      isIndexInitialized = true;
    }
    
    console.log('All data cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}

/**
 * Gets statistics about the current index and database.
 * @returns {Promise<object>} Index statistics
 */
export async function getIndexStats() {
  try {
    const stats = {
      indexInitialized: isIndexInitialized,
      hnswLibLoaded: hnswLib !== null,
      indexExists: hnswIndex !== null,
    };

    // Get database stats
    const pages = await db.pages.toArray();
    stats.totalPages = pages.length;
    
    if (pages.length > 0) {
      const validEmbeddings = pages.filter(page => 
        page.embedding && page.embedding.length === HNSW_CONFIG.dimension
      );
      stats.validEmbeddings = validEmbeddings.length;
      stats.invalidEmbeddings = pages.length - validEmbeddings.length;
      
      // Calculate approximate memory usage (rough estimate)
      const embeddingMemory = validEmbeddings.length * HNSW_CONFIG.dimension * 4; // 4 bytes per float
      const metadataMemory = pages.length * 200; // rough estimate for page metadata
      stats.approximateMemoryUsage = {
        embeddings: embeddingMemory,
        metadata: metadataMemory,
        total: embeddingMemory + metadataMemory
      };
      
      // Get oldest and newest entries
      const timestamps = pages.map(page => new Date(page.timestamp)).sort();
      stats.oldestEntry = timestamps[0]?.toISOString();
      stats.newestEntry = timestamps[timestamps.length - 1]?.toISOString();
    } else {
      stats.validEmbeddings = 0;
      stats.invalidEmbeddings = 0;
      stats.approximateMemoryUsage = { embeddings: 0, metadata: 0, total: 0 };
      stats.oldestEntry = null;
      stats.newestEntry = null;
    }

    // HNSW specific stats
    if (isIndexInitialized && hnswIndex) {
      try {
        stats.hnswCurrentCount = hnswIndex.getCurrentCount ? hnswIndex.getCurrentCount() : 'N/A';
        stats.hnswMaxElements = hnswIndex.getMaxElements ? hnswIndex.getMaxElements() : HNSW_CONFIG.maxElements;
      } catch (error) {
        console.warn('Could not get HNSW stats:', error);
        stats.hnswCurrentCount = 'N/A';
        stats.hnswMaxElements = HNSW_CONFIG.maxElements;
      }
    } else {
      stats.hnswCurrentCount = 0;
      stats.hnswMaxElements = HNSW_CONFIG.maxElements;
    }

    // Configuration info
    stats.config = {
      dimension: HNSW_CONFIG.dimension,
      maxElements: HNSW_CONFIG.maxElements,
      ef: HNSW_CONFIG.ef,
      M: HNSW_CONFIG.M,
      metric: HNSW_CONFIG.metric
    };

    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    return {
      error: error.message,
      indexInitialized: false,
      totalPages: 0
    };
  }
}
