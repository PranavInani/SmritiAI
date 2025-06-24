import { db } from './db';

/**
 * Calculates cosine similarity between two vectors
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
 * Initializes the search index.
 * With simple cosine similarity, no special initialization is needed.
 */
export async function initSearchIndex() {
  console.log('Search system initialized with cosine similarity.');
}

/**
 * Searches for the k most similar pages using cosine similarity.
 */
export async function searchPages(queryEmbedding, k = 5) {
  console.log('Searching pages using cosine similarity...');
  
  // Get all pages from the database
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

  console.log(`Found ${results.length} similar pages.`);
  return results;
}

/**
 * Adds a new page to the search system.
 * With simple cosine similarity, no special indexing is needed.
 */
export async function addPageToIndex(pageData) {
  console.log(`Page "${pageData.title}" added to search system.`);
  // No special indexing needed for cosine similarity approach
  // Pages are searched directly from the database
}
