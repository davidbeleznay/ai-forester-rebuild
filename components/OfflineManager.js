import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetwork } from '../utils/NetworkContext';
import SyncQueueManager from '../utils/SyncQueueManager';
import offlineStorage from '../utils/offlineStorage';

/**
 * Component for managing offline data and syncing operations
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Function to call when closing modal
 * @param {boolean} props.visible - Whether the modal is visible
 * @returns {JSX.Element} Offline manager component
 */
const OfflineManager = ({ onClose, visible }) => {
  const { isConnected, lastSyncTime, pendingSync, setPendingSync } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingCount: 0,
    failedCount: 0,
    totalCount: 0,
    lastSyncedAt: null
  });
  const [statusMessage, setStatusMessage] = useState('');

  // Load sync stats when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      loadSyncStats();
    }
  }, [visible]);

  // Load synchronization statistics
  const loadSyncStats = async () => {
    try {
      setIsLoading(true);
      
      // Initialize sync queue if not already initialized
      await SyncQueueManager.init();
      
      // Get pending operations count
      const pendingCount = SyncQueueManager.getPendingCount();
      const hasFailedOps = SyncQueueManager.hasFailedOperations();
      
      // Get total field cards count
      const allCards = await offlineStorage.getAllFieldCards();
      const unsyncedCards = allCards.filter(card => !card.synced);
      
      setStats({
        pendingCount,
        failedCount: hasFailedOps ? 1 : 0, // Just showing if any failed
        totalCount: allCards.length,
        unsyncedCount: unsyncedCards.length,
        lastSyncedAt: lastSyncTime
      });
      
      // Update pending sync status in context
      setPendingSync(pendingCount > 0);
      
    } catch (error) {
      console.error('Error loading sync stats:', error);
      setStatusMessage('Error loading synchronization statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual sync button press
  const handleSync = async () => {
    if (!isConnected) {
      setStatusMessage('Cannot sync while offline. Please connect to the internet and try again.');
      return;
    }
    
    try {
      setIsLoading(true);
      setStatusMessage('Syncing data...');
      
      const success = await SyncQueueManager.processQueue(true);
      
      if (success) {
        setStatusMessage('Synchronization completed successfully');
        // Reload stats after successful sync
        await loadSyncStats();
      } else {
        setStatusMessage('Some items failed to synchronize. You can retry the failed operations.');
      }
    } catch (error) {
      console.error('Error during sync:', error);
      setStatusMessage('Synchronization failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset failed operations
  const handleResetFailed = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Resetting failed operations...');
      
      const resetCount = await SyncQueueManager.resetFailedOperations();
      
      if (resetCount > 0) {
        setStatusMessage(`Reset ${resetCount} failed operations. You can now try syncing again.`);
        await loadSyncStats();
      } else {
        setStatusMessage('No failed operations to reset.');
      }
    } catch (error) {
      console.error('Error resetting failed operations:', error);
      setStatusMessage('Failed to reset operations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all pending operations (use with caution)
  const handleClearQueue = async () => {
    try {
      setIsLoading(true);
      setStatusMessage('Clearing sync queue...');
      
      await SyncQueueManager.clearQueue();
      setPendingSync(false);
      
      setStatusMessage('Sync queue cleared. Any unsynced changes will not be synchronized.');
      await loadSyncStats();
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      setStatusMessage('Failed to clear sync queue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format the last sync time
  const formatSyncTime = (time) => {
    if (!time) return 'Never';
    
    const date = new Date(time);
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Offline Data Manager</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          {/* Connection Status */}
          <View style={[
            styles.statusCard,
            isConnected ? styles.onlineCard : styles.offlineCard
          ]}>
            <View style={styles.statusIconContainer}>
              <Feather 
                name={isConnected ? "wifi" : "wifi-off"} 
                size={24} 
                color={isConnected ? "#4CAF50" : "#F44336"} 
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {isConnected ? "Online" : "Offline"}
              </Text>
              <Text style={styles.statusDescription}>
                {isConnected 
                  ? "You can synchronize your data with the server" 
                  : "Changes will be saved locally and synced when online"
                }
              </Text>
            </View>
          </View>
          
          {/* Sync Stats */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2c5e2e" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          ) : (
            <ScrollView style={styles.statsContainer}>
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Synchronization Status</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Last Synchronized:</Text>
                  <Text style={styles.statValue}>
                    {formatSyncTime(stats.lastSyncedAt)}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Pending Changes:</Text>
                  <Text style={[
                    styles.statValue,
                    stats.pendingCount > 0 ? styles.highlightText : null
                  ]}>
                    {stats.pendingCount}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Failed Operations:</Text>
                  <Text style={[
                    styles.statValue,
                    stats.failedCount > 0 ? styles.errorText : null
                  ]}>
                    {stats.failedCount > 0 ? 'Yes' : 'None'}
                  </Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total Field Cards:</Text>
                  <Text style={styles.statValue}>{stats.totalCount}</Text>
                </View>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Unsynced Field Cards:</Text>
                  <Text style={[
                    styles.statValue,
                    stats.unsyncedCount > 0 ? styles.highlightText : null
                  ]}>
                    {stats.unsyncedCount}
                  </Text>
                </View>
              </View>
              
              {statusMessage ? (
                <View style={styles.messageContainer}>
                  <Text style={styles.messageText}>{statusMessage}</Text>
                </View>
              ) : null}
              
              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.primaryButton,
                    (!isConnected || stats.pendingCount === 0) ? styles.disabledButton : null
                  ]}
                  onPress={handleSync}
                  disabled={!isConnected || stats.pendingCount === 0}
                >
                  <Feather name="refresh-cw" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Sync Now</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.secondaryButton,
                    stats.failedCount === 0 ? styles.disabledButton : null
                  ]}
                  onPress={handleResetFailed}
                  disabled={stats.failedCount === 0}
                >
                  <Feather name="rotate-ccw" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Reset Failed</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    styles.dangerButton,
                    stats.pendingCount === 0 ? styles.disabledButton : null
                  ]}
                  onPress={handleClearQueue}
                  disabled={stats.pendingCount === 0}
                >
                  <Feather name="trash-2" size={18} color="#fff" />
                  <Text style={styles.actionButtonText}>Clear Queue</Text>
                </TouchableOpacity>
              </View>
              
              {/* Offline Usage Tips */}
              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>Offline Usage Tips</Text>
                
                <View style={styles.tipItem}>
                  <Feather name="check-circle" size={16} color="#2c5e2e" style={styles.tipIcon} />
                  <Text style={styles.tipText}>
                    All field measurements and calculations work without internet
                  </Text>
                </View>
                
                <View style={styles.tipItem}>
                  <Feather name="check-circle" size={16} color="#2c5e2e" style={styles.tipIcon} />
                  <Text style={styles.tipText}>
                    Photos and notes are stored securely on your device
                  </Text>
                </View>
                
                <View style={styles.tipItem}>
                  <Feather name="check-circle" size={16} color="#2c5e2e" style={styles.tipIcon} />
                  <Text style={styles.tipText}>
                    Changes made offline will automatically sync when back online
                  </Text>
                </View>
                
                <View style={styles.tipItem}>
                  <Feather name="check-circle" size={16} color="#2c5e2e" style={styles.tipIcon} />
                  <Text style={styles.tipText}>
                    Reports can be generated and shared while offline
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
  },
  closeButton: {
    padding: 4,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  onlineCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  offlineCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  statusIconContainer: {
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#555',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  statsContainer: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statLabel: {
    fontSize: 14,
    color: '#555',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  highlightText: {
    color: '#FFA000', // Amber
  },
  errorText: {
    color: '#F44336', // Red
  },
  messageContainer: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#EDF7ED',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5e2e',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  primaryButton: {
    backgroundColor: '#2c5e2e',
  },
  secondaryButton: {
    backgroundColor: '#607D8B', // Blue Grey
  },
  dangerButton: {
    backgroundColor: '#F44336', // Red
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  tipsCard: {
    backgroundColor: '#EDF7ED',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c5e2e',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default OfflineManager;