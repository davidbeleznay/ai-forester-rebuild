import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNetwork } from '../utils/NetworkContext';

/**
 * Photo Gallery Screen
 * Displays and manages all captured photos, allows adding comments
 * and associating photos with field cards
 */
const PhotoGalleryScreen = ({ navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoComment, setPhotoComment] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const { isConnected } = useNetwork();

  // Load photos when component mounts and on refresh
  useEffect(() => {
    loadPhotos();
  }, []);

  // Load photos from AsyncStorage
  const loadPhotos = async () => {
    try {
      setLoading(true);
      const storedPhotos = await AsyncStorage.getItem('@temp_images');
      if (storedPhotos) {
        // Parse the stored photos and verify they still exist on the filesystem
        const parsedPhotos = JSON.parse(storedPhotos);
        
        // Filter out photos that no longer exist
        const validPhotos = [];
        for (const photo of parsedPhotos) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(photo.uri);
            if (fileInfo.exists) {
              validPhotos.push(photo);
            }
          } catch (err) {
            console.error('Error checking photo existence:', err);
          }
        }
        
        // Sort by timestamp (newest first)
        validPhotos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPhotos(validPhotos);
        
        // Update storage with only valid photos
        await AsyncStorage.setItem('@temp_images', JSON.stringify(validPhotos));
      } else {
        setPhotos([]);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  // Handle photo selection
  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setPhotoComment(photo.comment || '');
    setDetailModalVisible(true);
  };

  // Open edit comment modal
  const handleEditComment = () => {
    setDetailModalVisible(false);
    setCommentModalVisible(true);
  };

  // Save comment for a photo
  const handleSaveComment = async () => {
    if (!selectedPhoto) return;

    try {
      // Update the photo in the state
      const updatedPhotos = photos.map(photo => 
        photo.id === selectedPhoto.id ? { ...photo, comment: photoComment } : photo
      );
      setPhotos(updatedPhotos);
      
      // Update storage
      await AsyncStorage.setItem('@temp_images', JSON.stringify(updatedPhotos));
      
      // Close modal
      setCommentModalVisible(false);
      Alert.alert('Success', 'Comment saved successfully.');
    } catch (error) {
      console.error('Error saving comment:', error);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
    }
  };

  // Delete a photo
  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove from filesystem
              await FileSystem.deleteAsync(selectedPhoto.uri, { idempotent: true });
              
              // Update state
              const updatedPhotos = photos.filter(photo => photo.id !== selectedPhoto.id);
              setPhotos(updatedPhotos);
              
              // Update storage
              await AsyncStorage.setItem('@temp_images', JSON.stringify(updatedPhotos));
              
              // Close modal
              setDetailModalVisible(false);
              Alert.alert('Success', 'Photo deleted successfully.');
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert('Error', 'Failed to delete photo. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Associate photo with current field card
  const handleAssociatePhoto = () => {
    if (!selectedPhoto) return;
    
    // Close the detail modal
    setDetailModalVisible(false);
    
    // In a real implementation, this would open a modal to select a field card
    // or navigate to a screen where the user can choose a field card
    // For now, we'll just show an informational alert
    Alert.alert(
      'Associate Photo',
      'In a full implementation, this would allow you to associate the photo with a field card.',
      [{ text: 'OK' }]
    );
  };

  // Render a photo item in the grid
  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.photoItem}
      onPress={() => handlePhotoPress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      {item.comment ? (
        <View style={styles.commentIndicator}>
          <Feather name="message-square" size={14} color="#fff" />
        </View>
      ) : null}
      {item.isAssociated ? (
        <View style={styles.associatedIndicator}>
          <Feather name="link" size={14} color="#fff" />
        </View>
      ) : null}
    </TouchableOpacity>
  );

  // Empty state component when no photos are available
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="camera-off" size={50} color="#ccc" />
      <Text style={styles.emptyStateText}>No photos yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Use the floating camera button to capture photos
      </Text>
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => navigation.goBack()}
      >
        <Feather name="camera" size={18} color="#fff" />
        <Text style={styles.captureButtonText}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusIndicator,
            isConnected ? styles.onlineIndicator : styles.offlineIndicator
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Online' : 'Offline Mode'}
        </Text>
      </View>

      {/* Photo grid */}
      <FlatList
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={loading || photos.length === 0 ? { flex: 1 } : null}
        ListEmptyComponent={loading ? null : renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* Loading indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2c5e2e" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      )}

      {/* Photo detail modal */}
      <Modal
        visible={detailModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Photo Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setDetailModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.detailImage}
                  resizeMode="contain"
                />

                <View style={styles.detailInfo}>
                  <Text style={styles.dateText}>
                    {new Date(selectedPhoto.timestamp).toLocaleString()}
                  </Text>

                  <View style={styles.commentContainer}>
                    <Text style={styles.commentLabel}>Comment:</Text>
                    <Text style={styles.commentText}>
                      {selectedPhoto.comment || 'No comment added'}
                    </Text>
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={handleEditComment}
                    >
                      <Feather name="edit" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        {selectedPhoto.comment ? 'Edit Comment' : 'Add Comment'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.linkButton]}
                      onPress={handleAssociatePhoto}
                    >
                      <Feather name="link" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>
                        Associate with Field Card
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDeletePhoto}
                    >
                      <Feather name="trash-2" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Comment edit modal */}
      <Modal
        visible={commentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Comment</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCommentModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.commentImage}
                  resizeMode="cover"
                />

                <Text style={styles.editCommentLabel}>
                  Add notes about this photo:
                </Text>

                <TextInput
                  style={styles.commentInput}
                  value={photoComment}
                  onChangeText={setPhotoComment}
                  placeholder="Describe what's shown in this photo..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />

                <View style={styles.commentModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setCommentModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveComment}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  photoItem: {
    flex: 1/3,
    aspectRatio: 1,
    margin: 1,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  commentIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#2c5e2e',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  associatedIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#1976d2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#2c5e2e',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#555',
    marginTop: 20,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  captureButton: {
    flexDirection: 'row',
    backgroundColor: '#2c5e2e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
  },
  closeButton: {
    padding: 5,
  },
  detailImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#000',
  },
  detailInfo: {
    padding: 15,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  commentContainer: {
    marginVertical: 10,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  commentText: {
    fontSize: 15,
    color: '#555',
    fontStyle: 'italic',
  },
  actionButtons: {
    marginTop: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2c5e2e',
  },
  linkButton: {
    backgroundColor: '#1976d2',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  commentModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  commentImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  editCommentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    margin: 15,
    marginBottom: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    margin: 15,
    marginTop: 5,
    minHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  commentModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#555',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2c5e2e',
    borderRadius: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default PhotoGalleryScreen;
