import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetwork } from '../utils/NetworkContext';

/**
 * Component to display network connectivity status and synchronization status
 * @returns {JSX.Element} Status bar component
 */
const NetworkStatusBar = () => {
  const { 
    isConnected, 
    pendingSync, 
    lastSyncTime, 
    attemptSync 
  } = useNetwork();

  // Format the last sync time
  const getFormattedSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const syncDate = new Date(lastSyncTime);
    
    // If it was today, show time only
    if (syncDate.toDateString() === now.toDateString()) {
      return syncDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it was yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (syncDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise, show date
    return syncDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Handle sync button press
  const handleSyncPress = async () => {
    if (!isConnected || !pendingSync) return;
    
    await attemptSync();
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={[
          styles.indicator,
          isConnected ? styles.onlineIndicator : styles.offlineIndicator
        ]} />
        
        <Text style={styles.statusText}>
          {isConnected ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      <View style={styles.syncContainer}>
        {isConnected && pendingSync ? (
          <TouchableOpacity 
            style={styles.syncButton}
            onPress={handleSyncPress}
          >
            <Feather name="refresh-cw" size={14} color="#fff" />
            <Text style={styles.syncButtonText}>Sync Now</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lastSyncContainer}>
            <Text style={styles.lastSyncLabel}>
              Last sync:
            </Text>
            <Text style={styles.lastSyncTime}>
              {getFormattedSyncTime()}
            </Text>
          </View>
        )}
        
        {!isConnected && pendingSync && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>!</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50', // Green
  },
  offlineIndicator: {
    backgroundColor: '#F44336', // Red
  },
  statusText: {
    fontSize: 14,
    color: '#555',
  },
  syncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c5e2e',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  syncButtonText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  lastSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastSyncLabel: {
    fontSize: 12,
    color: '#777',
    marginRight: 4,
  },
  lastSyncTime: {
    fontSize: 12,
    color: '#555',
  },
  pendingBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF9800', // Orange
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  pendingText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default NetworkStatusBar;