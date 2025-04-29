import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineStorage from './offlineStorage';

// Queue key in AsyncStorage
const SYNC_QUEUE_KEY = '@sync_queue';
const MAX_RETRY_COUNT = 3;

/**
 * SyncQueueManager handles the queuing and processing of operations
 * that need to be synchronized with the server when connection is available
 */
class SyncQueueManager {
  constructor() {
    this.isProcessing = false;
    this.queue = [];
    this.hasLoadedQueue = false;
  }

  /**
   * Initialize the queue manager and load any existing queue
   */
  async init() {
    if (!this.hasLoadedQueue) {
      await this.loadQueue();
      this.hasLoadedQueue = true;
    }
  }

  /**
   * Load the queue from AsyncStorage
   */
  async loadQueue() {
    try {
      const queueString = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueString) {
        this.queue = JSON.parse(queueString);
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save the queue to AsyncStorage
   */
  async saveQueue() {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  /**
   * Add an operation to the queue
   * @param {Object} operation - The operation to queue
   */
  async addToQueue(operation) {
    await this.init();
    
    // Add to queue if not already present (avoid duplicates)
    const existing = this.queue.find(op => 
      op.type === operation.type && 
      op.id === operation.id && 
      op.timestamp === operation.timestamp
    );
    
    if (!existing) {
      const queueItem = {
        ...operation,
        retryCount: 0,
        status: 'pending'
      };
      
      this.queue.push(queueItem);
      await this.saveQueue();
    }
  }

  /**
   * Process the queue if online
   * @param {boolean} isOnline - Whether the device is online
   * @returns {Promise<boolean>} - Whether all operations were processed successfully
   */
  async processQueue(isOnline) {
    if (!isOnline || this.isProcessing) {
      return false;
    }
    
    await this.init();
    
    if (this.queue.length === 0) {
      return true;
    }
    
    this.isProcessing = true;
    let allSuccessful = true;
    
    try {
      // Process each operation in order
      for (let i = 0; i < this.queue.length; i++) {
        if (this.queue[i].status === 'completed') {
          continue;
        }
        
        const success = await this.processOperation(this.queue[i]);
        
        if (success) {
          this.queue[i].status = 'completed';
        } else {
          this.queue[i].retryCount++;
          this.queue[i].status = this.queue[i].retryCount >= MAX_RETRY_COUNT ? 'failed' : 'pending';
          allSuccessful = false;
        }
        
        // Save after each operation in case of interruptions
        await this.saveQueue();
      }
      
      // Clean up completed operations
      if (allSuccessful) {
        this.queue = this.queue.filter(op => op.status !== 'completed');
        await this.saveQueue();
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
      allSuccessful = false;
    }
    
    this.isProcessing = false;
    return allSuccessful;
  }

  /**
   * Process a single operation
   * @param {Object} operation - The operation to process
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async processOperation(operation) {
    try {
      // This would normally call your API services
      // For now we'll simulate success and mark the entities as synced
      switch (operation.type) {
        case 'save':
        case 'update':
          await offlineStorage.markAsSynced(operation.id);
          break;
          
        case 'delete':
          // Just mark as successful, no action needed
          break;
          
        case 'saveImage':
        case 'deleteImage':
          // Sync image operations with server
          // For now, just consider it done
          break;
          
        case 'addComment':
          // Sync comment with server
          // For now, just mark the card as synced
          await offlineStorage.markAsSynced(operation.id);
          break;
          
        default:
          console.warn(`Unknown operation type: ${operation.type}`);
          return false;
      }
      
      return true;
    } catch (error) {
      console.error(`Error processing operation ${operation.type}:`, error);
      return false;
    }
  }

  /**
   * Get the count of pending operations
   * @returns {number} - The number of pending operations
   */
  getPendingCount() {
    return this.queue.filter(op => op.status !== 'completed').length;
  }

  /**
   * Check if there are any failed operations
   * @returns {boolean} - Whether there are any failed operations
   */
  hasFailedOperations() {
    return this.queue.some(op => op.status === 'failed');
  }

  /**
   * Reset failed operations to pending
   * @returns {Promise<number>} - The number of operations reset
   */
  async resetFailedOperations() {
    await this.init();
    
    let resetCount = 0;
    
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].status === 'failed') {
        this.queue[i].status = 'pending';
        this.queue[i].retryCount = 0;
        resetCount++;
      }
    }
    
    if (resetCount > 0) {
      await this.saveQueue();
    }
    
    return resetCount;
  }

  /**
   * Clear all operations in the queue
   * @returns {Promise<boolean>} - Success indicator
   */
  async clearQueue() {
    try {
      this.queue = [];
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      return false;
    }
  }
}

// Export a singleton instance
export default new SyncQueueManager();