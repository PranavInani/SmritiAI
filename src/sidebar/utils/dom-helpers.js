/**
 * DOM utility functions for the sidebar
 */

/**
 * Create and append a message to the chat
 * @param {string} text - Message text
 * @param {string} type - Message type ('sent' | 'received')
 * @param {HTMLElement} container - Chat messages container
 * @returns {HTMLElement} Created message element
 */
export function appendMessage(text, type, container) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);
  messageElement.textContent = text;
  container.appendChild(messageElement);
  container.scrollTop = container.scrollHeight;
  return messageElement;
}

/**
 * Create a status indicator
 * @param {string} type - 'success', 'error', or 'loading'
 * @param {string} text - Optional text content
 * @returns {HTMLElement} Status element
 */
export function createStatusIndicator(type, text = '') {
  const status = document.createElement('span');
  
  switch (type) {
    case 'success':
      status.innerHTML = '<span class="success-text">✓</span>';
      break;
    case 'error':
      status.innerHTML = '<span class="error-text">✗</span>';
      break;
    case 'loading':
      status.innerHTML = '<span class="spinner"></span>';
      break;
    default:
      status.textContent = text;
  }
  
  return status;
}

/**
 * Set button state (text, disabled, spinner)
 * @param {HTMLElement} button - Button element
 * @param {HTMLElement} textElement - Text element inside button
 * @param {HTMLElement} spinner - Spinner element
 * @param {Object} state - Button state
 */
export function setButtonState(button, textElement, spinner, state) {
  const { text, disabled, loading } = state;
  
  if (text) textElement.textContent = text;
  button.disabled = disabled || false;
  
  if (loading) {
    spinner.classList.remove('hidden');
  } else {
    spinner.classList.add('hidden');
  }
}

/**
 * Show/hide element with optional delay
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - Whether to show or hide
 * @param {number} delay - Optional delay in ms
 */
export function toggleElement(element, show, delay = 0) {
  const action = () => {
    if (show) {
      element.classList.remove('hidden');
    } else {
      element.classList.add('hidden');
    }
  };
  
  if (delay > 0) {
    setTimeout(action, delay);
  } else {
    action();
  }
}

/**
 * Clear element's inner HTML and add loading state
 * @param {HTMLElement} element - Element to clear
 * @param {string} loadingText - Loading text to display
 */
export function setLoadingState(element, loadingText = 'Loading...') {
  element.innerHTML = `<span class="spinner"></span> ${loadingText}`;
}

/**
 * Auto-resize textarea based on content
 * @param {HTMLTextAreaElement} textarea - Textarea element
 */
export function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}
