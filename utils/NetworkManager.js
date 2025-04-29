/**
 * Network Manager
 * Utility for managing network connectivity state with safe fallbacks
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkManager {
  /**
   * Check if device is connected to network
   * Uses fetch() instead of getCurrentState() for better compatibility
   */
  static async isConnected() {
    try {
      // Use the newer API approach that avoids getCurrentState
      const state = await NetInfo.fetch();
      return state?.isConnected === true;
    } catch (error) {
      console.warn('Network check error:', error);
      // Default to connected to prevent blocking features
      return true;
    }
  }

  /**
   * Subscribe to network state changes
   * @param {Function} callback - Function to call when network state changes
   * @returns {Function} - Unsubscribe function
   */
  static addConnectionListener(callback) {
    try {
      // Use the safer addEventListener API
      const unsubscribe = NetInfo.addEventListener(state => {
        const isConnected = state?.isConnected === true;
        callback(isConnected);
      });
      
      return unsubscribe;
    } catch (error) {
      console.warn('Error setting up network listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  /**
   * Save last sync time to storage
   * @param {Date} time - Sync timestamp
   */
  static async saveLastSyncTime(time) {
    try {
      const timeString = time.toISOString();
      await AsyncStorage.setItem('@last_sync_time', timeString);
      return true;
    } catch (error) {
      console.error('Failed to save sync time:', error);
      return false;
    }
  }

  /**
   * Load last sync time from storage
   * @returns {Date|null} - Last sync time or null
   */
  static async getLastSyncTime() {
    try {
      const timeString = await AsyncStorage.getItem('@last_sync_time');
      return timeString ? new Date(timeString) : null;
    } catch (error) {
      console.error('Failed to load sync time:', error);
      return null;
    }
  }

  /**
   * Add item to pending sync queue
   * @param {Object} item - Item to sync
   */
  static async addToPendingSync(item) {
    try {
      const existingItemsString = await AsyncStorage.getItem('@pending_sync');
      const existingItems = existingItemsString ? JSON.parse(existingItemsString) : [];
      
      existingItems.push({
        ...item,
        timestamp: new Date().toISOString(),
      });
      
      await AsyncStorage.setItem('@pending_sync', JSON.stringify(existingItems));
      return true;
    } catch (error) {
      console.error('Error adding to pending sync:', error);
      return false;
    }
  }

  /**
   * Get pending sync items
   * @returns {Array} - Pending sync items
   */
  static async getPendingSync() {
    try {
      const itemsString = await AsyncStorage.getItem('@pending_sync');
      return itemsString ? JSON.parse(itemsString) : [];
    } catch (error) {
      console.error('Error getting pending sync:', error);
      return [];
    }
  }

  /**
   * Clear pending sync queue
   */
  static async clearPendingSync() {
    try {
      await AsyncStorage.removeItem('@pending_sync');
      return true;
    } catch (error) {
      console.error('Error clearing pending sync:', error);
      return false;
    }
  }
}

export default NetworkManager;