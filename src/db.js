import Dexie from 'dexie';

export const db = new Dexie('smriti_ai_db');

// The schema remains the same, as 'content' was not an indexed field.
db.version(1).stores({
  pages: '++id, &url, title, timestamp',
});

/**
 * Adds or updates a page with its embedding in the database.
 * The textContent is no longer saved.
 * @param {object} pageData
 * @param {string} pageData.url
 * @param {string} pageData.title
 * @param {Float32Array} pageData.embedding - The generated vector
 * @returns {Promise<object>} The saved page data with ID
 */
export async function addOrUpdatePage(pageData) {
  try {
    // Destructure without textContent
    const { url, title, embedding } = pageData;
    const timestamp = new Date().toISOString();

    // Save to the database without the textContent field
    const id = await db.pages.put({
      url,
      title,
      embedding,
      timestamp,
    });

    console.log(`Successfully saved embedding for: ${title}`);
    
    // Return the page data with the ID
    return {
      id,
      url,
      title,
      embedding,
      timestamp,
    };
  } catch (error) {
    console.error(`Failed to save page ${pageData.url}:`, error);
    return null;
  }
}
