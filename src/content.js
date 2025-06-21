import { Readability } from '@mozilla/readability';

// Use a flag to ensure the script only runs once per page load.
if (typeof window.hasRun === 'undefined') {
  window.hasRun = true;

  try {
    /* Clone the document to avoid modifying the live page,
     * as Readability will modify the DOM of the document it is given. */
    const documentClone = document.cloneNode(true);
    const reader = new Readability(documentClone);
    const article = reader.parse();

    // 'article' will be null if Readability couldn't find an article.
    if (article && article.textContent.trim().length > 0) {
      const pageData = {
        url: window.location.href,
        title: article.title,
        content: article.textContent,
      };
      
      // Use browser.* namespace for sending the message
      browser.runtime.sendMessage({ action: "processPageData", data: pageData });
    }
  } catch (e) {
    // It's common for Readability to fail on pages that aren't articles,
    // so we can often ignore these errors.
    if (e.name !== 'TypeError') {
        console.error("Error processing page with Readability: ", e);
    }
  }
}