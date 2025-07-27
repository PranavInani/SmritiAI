/**
 * Domain filtering utilities for search results
 */

/**
 * Parse domain filter string into include/exclude lists
 * Format: "domain1.com,domain2.com,-exclude1.com,-exclude2.com"
 * @param {string} filterString - Domain filter string
 * @returns {Object} Parsed filter object with include/exclude arrays
 */
export function parseDomainFilter(filterString) {
  if (!filterString || typeof filterString !== 'string') {
    return { include: [], exclude: [] };
  }

  const domains = filterString.split(',').map(d => d.trim()).filter(d => d.length > 0);
  const include = [];
  const exclude = [];

  for (const domain of domains) {
    if (domain.startsWith('-')) {
      // Exclude domain (remove the - prefix)
      const excludeDomain = domain.substring(1).trim();
      if (excludeDomain.length > 0) {
        exclude.push(excludeDomain.toLowerCase());
      }
    } else {
      // Include domain
      include.push(domain.toLowerCase());
    }
  }

  return { include, exclude };
}

/**
 * Extract domain from a URL
 * @param {string} url - Full URL
 * @returns {string} Domain name (lowercase)
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch (error) {
    console.warn('Invalid URL for domain extraction:', url);
    return '';
  }
}

/**
 * Check if a page matches the domain filter criteria
 * @param {Object} page - Page object with url property
 * @param {Object} domainFilter - Parsed domain filter object
 * @returns {boolean} True if page matches filter criteria
 */
export function matchesDomainFilter(page, domainFilter) {
  if (!domainFilter || (!domainFilter.include.length && !domainFilter.exclude.length)) {
    return true; // No filter applied
  }

  const pageDomain = extractDomain(page.url);
  
  // If include list exists, page must be in include list
  if (domainFilter.include.length > 0) {
    if (!domainFilter.include.includes(pageDomain)) {
      return false;
    }
  }

  // If exclude list exists, page must not be in exclude list
  if (domainFilter.exclude.length > 0) {
    if (domainFilter.exclude.includes(pageDomain)) {
      return false;
    }
  }

  return true;
}

/**
 * Apply domain filtering to search results
 * @param {Array} pages - Array of page objects
 * @param {string} domainFilterString - Domain filter string
 * @returns {Array} Filtered pages
 */
export function applyDomainFilter(pages, domainFilterString) {
  if (!domainFilterString) {
    return pages;
  }

  const domainFilter = parseDomainFilter(domainFilterString);
  return pages.filter(page => matchesDomainFilter(page, domainFilter));
}

/**
 * Get unique domains from an array of pages
 * @param {Array} pages - Array of page objects
 * @returns {Array} Sorted array of unique domains
 */
export function getUniqueDomains(pages) {
  const domains = new Set();
  
  for (const page of pages) {
    const domain = extractDomain(page.url);
    if (domain) {
      domains.add(domain);
    }
  }
  
  return Array.from(domains).sort();
}
