/**
 * Domain Filter Component
 * Handles domain filtering UI and functionality
 */

import { getAvailableDomains } from '../services/message-service.js';
import { createElement } from '../utils/dom-helpers.js';

export class DomainFilter {
  constructor() {
    this.container = null;
    this.input = null;
    this.inputContainer = null; // Add this reference
    this.suggestionList = null;
    this.availableDomains = [];
    this.currentFilter = '';
    this.isVisible = false;
    
    // Don't call init() automatically - it will be called from sidebar.js
  }

  /**
   * Initialize the domain filter component
   */
  async init() {
    await this.loadAvailableDomains();
    this.createUI();
    this.attachEventListeners();
  }

  /**
   * Load available domains from the background script
   */
  async loadAvailableDomains() {
    try {
      const response = await getAvailableDomains();
      if (response.success) {
        this.availableDomains = response.data.domains;
        console.log(`Loaded ${this.availableDomains.length} available domains`);
      }
    } catch (error) {
      console.error('Failed to load available domains:', error);
      this.availableDomains = [];
    }
  }

  /**
   * Create the domain filter UI
   */
  createUI() {
    // Main container
    this.container = createElement('div', {
      className: 'domain-filter-container',
      innerHTML: `
        <div class="domain-filter-toggle">
          <button id="domain-filter-btn" class="domain-filter-button" title="Filter by domain">
            🌐 Domain Filter
          </button>
        </div>
        <div class="domain-filter-input-container hidden" id="domain-filter-input-container">
          <input 
            type="text" 
            id="domain-filter-input" 
            placeholder="Enter domains (e.g., example.com, -exclude.com)" 
            autocomplete="off"
          />
          <div class="domain-filter-help">
            <span>Use commas to separate domains. Prefix with '-' to exclude (e.g., github.com, -ads.com)</span>
          </div>
          <div class="domain-suggestions hidden" id="domain-suggestions"></div>
          <div class="domain-filter-actions">
            <button id="apply-domain-filter" class="btn-primary btn-small">Apply</button>
            <button id="clear-domain-filter" class="btn-secondary btn-small">Clear</button>
          </div>
        </div>
      `
    });

    // Get references to elements
    this.input = this.container.querySelector('#domain-filter-input');
    this.inputContainer = this.container.querySelector('#domain-filter-input-container'); // Store reference
    this.suggestionList = this.container.querySelector('#domain-suggestions');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const toggleBtn = this.container.querySelector('#domain-filter-btn');
    const applyBtn = this.container.querySelector('#apply-domain-filter');
    const clearBtn = this.container.querySelector('#clear-domain-filter');

    // Toggle domain filter visibility
    toggleBtn.addEventListener('click', () => {
      this.isVisible = !this.isVisible;
      this.inputContainer.classList.toggle('hidden', !this.isVisible);
      
      if (this.isVisible) {
        this.input.focus();
        this.updateToggleButton();
      } else {
        this.hideSuggestions();
      }
    });

    // Input events
    this.input.addEventListener('input', () => {
      this.showSuggestions();
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.applyFilter();
      } else if (e.key === 'Escape') {
        this.hideSuggestions();
      }
    });

    // Button events
    applyBtn.addEventListener('click', () => this.applyFilter());
    clearBtn.addEventListener('click', () => this.clearFilter());
  }

  /**
   * Show domain suggestions based on input
   */
  showSuggestions() {
    const inputValue = this.input.value.toLowerCase();
    const lastTerm = inputValue.split(',').pop().trim();
    
    if (lastTerm.length < 1) {
      this.hideSuggestions();
      return;
    }

    // Filter domains that match the current input
    const matchingDomains = this.availableDomains.filter(domain => 
      domain.toLowerCase().includes(lastTerm.replace(/^-/, ''))
    ).slice(0, 10); // Limit to 10 suggestions

    if (matchingDomains.length === 0) {
      this.hideSuggestions();
      return;
    }

    // Create suggestion items
    this.suggestionList.innerHTML = '';
    matchingDomains.forEach(domain => {
      const suggestion = createElement('div', {
        className: 'domain-suggestion',
        textContent: domain,
        onclick: () => this.selectDomain(domain)
      });
      this.suggestionList.appendChild(suggestion);
    });

    this.suggestionList.classList.remove('hidden');
  }

  /**
   * Hide domain suggestions
   */
  hideSuggestions() {
    this.suggestionList.classList.add('hidden');
  }

  /**
   * Select a domain from suggestions
   */
  selectDomain(domain) {
    const currentValue = this.input.value;
    const terms = currentValue.split(',');
    terms[terms.length - 1] = domain;
    this.input.value = terms.join(', ') + ', ';
    this.input.focus();
    this.hideSuggestions();
  }

  /**
   * Apply the domain filter
   */
  applyFilter() {
    const filterValue = this.input.value.trim();
    this.currentFilter = filterValue;
    this.hideSuggestions();
    this.updateToggleButton();
    
    // Close the domain filter UI after applying - use stored reference
    this.isVisible = false;
    this.inputContainer.classList.add('hidden');
    
    // Dispatch custom event to notify other components
    this.container.dispatchEvent(new CustomEvent('domainFilterApplied', {
      detail: { filter: filterValue },
      bubbles: true
    }));
  }

  /**
   * Clear the domain filter
   */
  clearFilter() {
    this.input.value = '';
    this.currentFilter = '';
    this.hideSuggestions();
    this.updateToggleButton();
    
    // Dispatch custom event
    this.container.dispatchEvent(new CustomEvent('domainFilterCleared', {
      bubbles: true
    }));
  }

  /**
   * Update the toggle button appearance
   */
  updateToggleButton() {
    const toggleBtn = this.container.querySelector('#domain-filter-btn');
    
    if (this.currentFilter) {
      toggleBtn.classList.add('active');
      toggleBtn.title = `Domain Filter: ${this.currentFilter}`;
    } else {
      toggleBtn.classList.remove('active');
      toggleBtn.title = 'Filter by domain';
    }
  }

  /**
   * Get the current domain filter
   */
  getCurrentFilter() {
    return this.currentFilter;
  }

  /**
   * Set the domain filter programmatically
   */
  setFilter(filter) {
    this.input.value = filter;
    this.currentFilter = filter;
    this.updateToggleButton();
  }

  /**
   * Get the container element for mounting
   */
  getElement() {
    return this.container;
  }

  /**
   * Refresh available domains
   */
  async refreshDomains() {
    await this.loadAvailableDomains();
  }
}
