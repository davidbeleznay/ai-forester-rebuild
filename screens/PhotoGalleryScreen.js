import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useIsFocused } from '@react-navigation/native';

/**
 * Photo Gallery Screen
 * Displays and manages all captured photos in the app
 */
const PhotoGalleryScreen = ({ navigation }) => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFocused = useIsFocused();

  // Load images when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      loadImages();
    }
  }, [isFocused]);

  // Load images from storage
  const loadImages = async () => {
    try {
      setIsLoading(true);
      const imagesJson = await AsyncStorage.getItem('@temp_images');
      const storedImages = imagesJson ? JSON.parse(imagesJson) : [];
      
      // Verify files exist
      const validImages = [];
      for (const img of storedImages) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(img.uri);
          if (fileInfo.exists) {
            validImages.push(img);
          }
        } catch (e) {
          console.log('Image file not found:', img.uri);
        }
      }
      
      // Sort by timestamp (newest first)
      validImages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setImages(validImages);
    } catch (error) {
      console.error('Error loading images:', error);
      Alert.alert('Error', 'Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image press to show details
  const handleImagePress = (image) => {
    setSelectedImage(image);
    setComment(image.comment || '');
    setModalVisible(true);
  };

  // Handle editing comment
  const handleEditComment = () => {
    setModalVisible(false);
    setEditModalVisible(true);
  };

  // Save updated comment
  const handleSaveComment = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      
      // Update comment in the image
      const updatedImages = images.map(img => 
        img.id === selectedImage.id ? { ...img, comment } : img
      );
      
      // Save updated images to storage
      await AsyncStorage.setItem('@temp_images', JSON.stringify(updatedImages));
      setImages(updatedImages);
      setEditModalVisible(false);
      
      Alert.alert('Success', 'Comment saved successfully');
    } catch (error) {
      console.error('Error saving comment:', error);
      Alert.alert('Error', 'Failed to save comment');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      
      // Delete file
      await FileSystem.deleteAsync(selectedImage.uri, { idempotent: true });
      
      // Remove from storage
      const updatedImages = images.filter(img => img.id !== selectedImage.id);
      await AsyncStorage.setItem('@temp_images', JSON.stringify(updatedImages));
      setImages(updatedImages);
      setModalVisible(false);
      
      Alert.alert('Success', 'Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };

  // Render image item
  const renderImageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.imageContainer}
      onPress={() => handleImagePress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      
      {item.comment ? (
        <View style={styles.commentIndicator}>
          <Feather name="message-square" size={14} color="#fff" />
        </View>
      ) : null}
      
      <View style={styles.imageDateContainer}>
        <Text style={styles.imageDate}>
          {new Date(item.timestamp).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Gallery</Text>
      </View>
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2c5e2e" />
        </View>
      )}
      
      {/* Image grid */}
      {images.length > 0 ? (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.imageGrid}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="camera-off" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No photos yet</Text>
          <Text style={styles.emptySubtext}>
            Photos you capture will appear here
          </Text>
        </View>
      )}
      
      {/* Image detail modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <>
                <Image 
                  source={{ uri: selectedImage.uri }}
                  style={styles.fullImage}
                  resizeMode="contain"
                />
                
                <View style={styles.imageInfo}>
                  <Text style={styles.imageTimestamp}>
                    {new Date(selectedImage.timestamp).toLocaleString()}
                  </Text>
                  
                  {selectedImage.comment ? (
                    <View style={styles.commentContainer}>
                      <Text style={styles.commentLabel}>Notes:</Text>
                      <Text style={styles.commentText}>{selectedImage.comment}</Text>
                    </View>
                  ) : (
                    <Text style={styles.noCommentText}>No notes added</Text>
                  )}
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={handleEditComment}
                  >
                    <Feather name="edit-2" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>
                      {selectedImage.comment ? 'Edit Notes' : 'Add Notes'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDeleteImage}
                  >
                    <Feather name="trash-2" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Comment edit modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Notes</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <>
                <Image 
                  source={{ uri: selectedImage.uri }}
                  style={styles.editImage}
                  resizeMode="cover"
                />
                
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Add notes about this photo..."
                  multiline
                  numberOfLines={4}
                />
                
                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
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
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#2c5e2e',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  imageGrid: {
    padding: 4,
  },
  imageContainer: {
    flex: 1/3,
    margin: 4,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#eee',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  commentIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2c5e2e',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageDateContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 4,
  },
  imageDate: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  fullImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  imageInfo: {
    padding: 16,
  },
  imageTimestamp: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  commentContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2c5e2e',
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    color: '#333',
  },
  noCommentText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  editButton: {
    backgroundColor: '#2c5e2e',
  },
  deleteButton: {
    backgroundColor: '#e53935',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  editModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  editImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  commentInput: {
    margin: 16,
    padding: 12,
    height: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2c5e2e',
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});

export default PhotoGalleryScreen;
