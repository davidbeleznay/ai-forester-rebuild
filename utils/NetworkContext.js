import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkManager from './NetworkManager';

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

    // Subscribe to network state updates with the new NetworkManager
    const unsubscribe = NetworkManager.addConnectionListener((isConnectedNow) => {
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
      const time = await NetworkManager.getLastSyncTime();
      if (time) {
        setLastSyncTime(time);
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  };

  // Save last sync time to storage
  const saveLastSyncTime = async (time) => {
    try {
      await NetworkManager.saveLastSyncTime(time);
      setLastSyncTime(time);
      return true;
    } catch (error) {
      console.error('Failed to save sync time:', error);
      return false;
    }
  };

  // Check current connection status - with improved error handling
  const checkConnection = async () => {
    try {
      // Use NetworkManager for safer network state checking
      const isConnectedNow = await NetworkManager.isConnected();
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
      const pendingItems = await NetworkManager.getPendingSync();
      if (pendingItems.length > 0) {
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
      const pendingItems = await NetworkManager.getPendingSync();
      if (!pendingItems.length) {
        setPendingSync(false);
        return true;
      }

      // Process each pending item
      // This would normally involve API calls to your backend
      // For now, we'll just simulate successful sync
      
      // Clear pending items after successful sync
      await NetworkManager.clearPendingSync();
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
      await NetworkManager.addToPendingSync(item);
      setPendingSync(true);
      
      // Try to sync immediately if connected
      if (isConnected) {
        attemptSync();
      }
      
      return true;
    } catch (error) {
      console.error('Error adding to pending sync:', error);
      return false;
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