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

    // First, try to find existing page
    const existingPage = await db.pages.where('url').equals(url).first();
    
    if (existingPage) {
      // Update existing page
      await db.pages.update(existingPage.id, {
        title,
        embedding,
        timestamp,
      });
      
      console.log(`Successfully updated embedding for: ${title}`);
      
      return {
        id: existingPage.id,
        url,
        title,
        embedding,
        timestamp,
      };
    } else {
      // Add new page
      const id = await db.pages.add({
        url,
        title,
        embedding,
        timestamp,
      });

      console.log(`Successfully saved new embedding for: ${title}`);
      
      return {
        id,
        url,
        title,
        embedding,
        timestamp,
      };
    }
  } catch (error) {
    console.error(`Failed to save page ${pageData.url}:`, error);
    return null;
  }
}
