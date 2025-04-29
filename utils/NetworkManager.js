/**
 * Network Manager
 * Utility for managing network connectivity state with safe fallbacks
 */

import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

class NetworkManager {
  /**
   * Check if device is connected to network
   * Uses direct network check as primary method, NetInfo as fallback
   */
  static async isConnected() {
    try {
      // First try a direct network check
      try {
        const response = await fetch('https://www.google.com/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          },
          timeout: 5000
        });
        return response.status === 200;
      } catch (fetchError) {
        console.warn('Direct network check failed:', fetchError);
        
        // Fallback to NetInfo if direct check fails
        try {
          // In newer versions, NetInfo.fetch() may work differently
          if (typeof NetInfo.fetch === 'function') {
            const state = await NetInfo.fetch();
            return !!state?.isConnected;
          } else {
            // If fetch doesn't work either, default to true
            console.warn('NetInfo.fetch is not available');
            return true;
          }
        } catch (netInfoError) {
          console.warn('NetInfo fallback failed:', netInfoError);
          return true; // Default to true to avoid blocking features
        }
      }
    } catch (error) {
      console.warn('Network check error:', error);
      // Default to connected to prevent blocking features
      return true;
    }
  }

  /**
   * Subscribe to network state changes
   * Uses addEventListener safely
   * @param {Function} callback - Function to call when network state changes
   * @returns {Function} - Unsubscribe function
   */
  static addConnectionListener(callback) {
    try {
      // Check if addEventListener is available
      if (typeof NetInfo.addEventListener !== 'function') {
        console.warn('NetInfo.addEventListener is not available');
        
        // Return a dummy function to avoid errors
        return () => {};
      }
      
      // Set up a network state check interval as backup
      const intervalId = setInterval(async () => {
        try {
          const isConnected = await this.isConnected();
          callback(isConnected);
        } catch (error) {
          console.warn('Error in network check interval:', error);
        }
      }, 30000); // Check every 30 seconds
      
      // Try to use the native listener as well
      let nativeUnsubscribe = () => {};
      try {
        nativeUnsubscribe = NetInfo.addEventListener(state => {
          try {
            const isConnected = state?.isConnected === true;
            callback(isConnected);
          } catch (callbackError) {
            console.warn('Error in network listener callback:', callbackError);
            // Default to connected to avoid blocking features
            callback(true);
          }
        });
      } catch (error) {
        console.warn('Error setting up network listener:', error);
      }
      
      // Return a function that cleans up both
      return () => {
        clearInterval(intervalId);
        if (typeof nativeUnsubscribe === 'function') {
          nativeUnsubscribe();
        }
      };
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
  
  /**
   * Safe method to directly check network connectivity
   * This provides a fallback when NetInfo is not reliable
   */
  static async checkDirectConnection() {
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Direct connection check failed:', error);
      return false;
    }
  }
}

export default NetworkManager;