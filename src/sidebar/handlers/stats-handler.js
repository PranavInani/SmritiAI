import { getIndexStats } from '../services/message-service.js';

/**
 * Statistics Handler for displaying index stats
 */
export class StatsHandler {
  constructor(chatInterface) {
    this.chatInterface = chatInterface;
  }

  /**
   * Show index statistics
   */
  async showStats() {
    try {
      const response = await getIndexStats();

      if (response.success) {
        this.displayIndexStats(response.stats);
      } else {
        this.chatInterface.addMessage('Failed to get index stats.', 'received');
      }
    } catch (error) {
      console.error('Error getting index stats:', error);
      this.chatInterface.addMessage('Error getting index stats. See console for details.', 'received');
    }
  }

  /**
   * Display index statistics in chat
   * @param {Object} stats - Index statistics
   */
  displayIndexStats(stats) {
    const statsMessage = document.createElement('div');
    statsMessage.classList.add('message', 'received');
    
    let statusIcon = stats.indexInitialized ? '✅' : '❌';
    let memoryMB = (stats.approximateMemoryUsage?.total / (1024 * 1024)).toFixed(2);
    
    statsMessage.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">📊 Index Statistics</div>
      <div style="font-family: monospace; font-size: 0.85em; line-height: 1.4;">
        <div><strong>Status:</strong> ${statusIcon} ${stats.indexInitialized ? 'Active' : 'Inactive'}</div>
        <div><strong>Total Pages:</strong> ${stats.totalPages}</div>
        <div><strong>Valid Embeddings:</strong> ${stats.validEmbeddings}</div>
        ${stats.invalidEmbeddings > 0 ? `<div><strong>Invalid Embeddings:</strong> ${stats.invalidEmbeddings}</div>` : ''}
        <div><strong>Memory Usage:</strong> ~${memoryMB} MB</div>
        ${stats.hnswCurrentCount !== 'N/A' ? `<div><strong>HNSW Index Size:</strong> ${stats.hnswCurrentCount} / ${stats.hnswMaxElements}</div>` : ''}
        <br>
        <div><strong>Configuration:</strong></div>
        <div style="margin-left: 10px;">
          <div>• Dimension: ${stats.config.dimension}</div>
          <div>• Distance: ${stats.config.metric}</div>
          <div>• M: ${stats.config.M}, ef: ${stats.config.ef}</div>
        </div>
        ${stats.oldestEntry ? `<br><div><strong>Oldest Entry:</strong> ${new Date(stats.oldestEntry).toLocaleDateString()}</div>` : ''}
        ${stats.newestEntry ? `<div><strong>Newest Entry:</strong> ${new Date(stats.newestEntry).toLocaleDateString()}</div>` : ''}
      </div>
    `;
    
    this.chatInterface.chatMessages.appendChild(statsMessage);
    this.chatInterface.chatMessages.scrollTop = this.chatInterface.chatMessages.scrollHeight;
  }
}
