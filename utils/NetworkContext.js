import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create context
export const NetworkContext = createContext({
  isConnected: true,
  lastSyncTime: null,
  pendingSync: false,
  initializeSync: () => {},
  attemptSync: () => Promise.resolve(),
  setPendingSync: () => {},
  checkConnection: () => Promise.resolve(true),
});

/**
 * Network Provider component for managing online/offline state
 * and synchronization functionality throughout the app
 */
export const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [pendingSync, setPendingSync] = useState(false);

  // Check connection state on mount and set up listener
  useEffect(() => {
    // Initial check
    checkConnection();

    // Subscribe to network state updates - using a safer approach
    const unsubscribe = NetInfo.addEventListener(networkState => {
      // More safely handle the network state
      const isConnectedNow = networkState && 
        typeof networkState.isConnected === 'boolean' ? 
        networkState.isConnected : true;
        
      setIsConnected(isConnectedNow);
      
      // If connection was restored and we have pending changes
      if (isConnectedNow && pendingSync) {
        attemptSync();
      }
    });

    // Get last sync time
    loadLastSyncTime();

    // Clean up
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [pendingSync]);

  // Load last sync time from storage
  const loadLastSyncTime = async () => {
    try {
      const timeString = await AsyncStorage.getItem('@last_sync_time');
      if (timeString) {
        setLastSyncTime(new Date(timeString));
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  };

  // Save last sync time to storage
  const saveLastSyncTime = async (time) => {
    try {
      const timeString = time.toISOString();
      await AsyncStorage.setItem('@last_sync_time', timeString);
      setLastSyncTime(time);
    } catch (error) {
      console.error('Failed to save sync time:', error);
    }
  };

  // Check current connection status - with improved error handling
  const checkConnection = async () => {
    try {
      // Safer way to check connection that doesn't rely on getCurrentState
      const state = await NetInfo.fetch().catch(() => ({ isConnected: true }));
      const isConnectedNow = state && typeof state.isConnected === 'boolean' ? 
        state.isConnected : true;
      
      setIsConnected(isConnectedNow);
      return isConnectedNow;
    } catch (error) {
      console.error('Error checking connection:', error);
      // Default to true when there's an error checking connection
      // This avoids unnecessary offline mode triggering
      return true;
    }
  };

  // Initialize sync process and data structures
  const initializeSync = async () => {
    try {
      // Check for pending sync items
      const pendingItems = await AsyncStorage.getItem('@pending_sync');
      if (pendingItems) {
        setPendingSync(true);
        // Try to sync immediately if connected
        if (await checkConnection()) {
          attemptSync();
        }
      }
    } catch (error) {
      console.error('Error initializing sync:', error);
    }
  };

  // Attempt to synchronize data with the server
  const attemptSync = async () => {
    if (!isConnected) {
      return false;
    }

    try {
      // Get pending sync items
      const pendingItemsString = await AsyncStorage.getItem('@pending_sync');
      if (!pendingItemsString) {
        setPendingSync(false);
        return true;
      }

      const pendingItems = JSON.parse(pendingItemsString);
      if (!pendingItems.length) {
        setPendingSync(false);
        return true;
      }

      // Process each pending item
      // This would normally involve API calls to your backend
      // For now, we'll just simulate successful sync
      
      // Clear pending items after successful sync
      await AsyncStorage.removeItem('@pending_sync');
      setPendingSync(false);
      
      // Update last sync time
      const now = new Date();
      await saveLastSyncTime(now);
      
      return true;
    } catch (error) {
      console.error('Error during sync:', error);
      return false;
    }
  };

  // Add an item to the pending sync queue
  const addToPendingSync = async (item) => {
    try {
      // Get existing items
      const existingItemsString = await AsyncStorage.getItem('@pending_sync');
      const existingItems = existingItemsString ? JSON.parse(existingItemsString) : [];
      
      // Add new item
      existingItems.push(item);
      
      // Save back to storage
      await AsyncStorage.setItem('@pending_sync', JSON.stringify(existingItems));
      setPendingSync(true);
      
      // Try to sync immediately if connected
      if (isConnected) {
        attemptSync();
      }
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  };

  // Context value
  const contextValue = {
    isConnected,
    lastSyncTime,
    pendingSync,
    initializeSync,
    attemptSync,
    setPendingSync,
    checkConnection,
    addToPendingSync,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

// Custom hook for using the network context
export const useNetwork = () => useContext(NetworkContext);

export default NetworkProvider;
