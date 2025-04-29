import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  FlatList, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import offlineStorage from '../utils/offlineStorage';

/**
 * Component for capturing, managing, and annotating field images
 * @param {Object} props - Component props
 * @param {string} props.fieldCardId - ID of the field card to associate images with
 * @param {Function} props.onImagesUpdated - Callback when images are updated
 * @returns {JSX.Element} Image capture manager component
 */
const ImageCaptureManager = ({ fieldCardId, onImagesUpdated }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [imageComment, setImageComment] = useState('');

  // Load existing images when component mounts or fieldCardId changes
  useEffect(() => {
    if (fieldCardId) {
      loadImages();
    }
  }, [fieldCardId]);

  // Load images for the current field card
  const loadImages = async () => {
    try {
      setIsLoading(true);
      
      const fieldCard = await offlineStorage.getFieldCard(fieldCardId);
      
      if (fieldCard && fieldCard.images) {
        setImages(fieldCard.images);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error('Error loading images:', error);
      Alert.alert('Error', 'Failed to load saved images.');
    } finally {
      setIsLoading(false);
    }
  };

  // Take a photo using the camera
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant camera permissions to take photos.');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  // Select an image from the device gallery
  const handleSelectImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant media library permissions to select photos.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Save an image to storage and update the field card
  const saveImage = async (uri) => {
    if (!fieldCardId) {
      Alert.alert('Error', 'No active field card. Please save the field card first.');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create directory if it doesn't exist
      const dirPath = `${FileSystem.documentDirectory}images/${fieldCardId}/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
      
      // Create filename and path
      const timestamp = new Date().getTime();
      const filename = `image_${timestamp}.jpg`;
      const destinationUri = `${dirPath}${filename}`;
      
      // Copy the image to app directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Create new image object
      const newImage = {
        id: `img_${timestamp}`,
        uri: destinationUri,
        timestamp: new Date().toISOString(),
        comment: '',
      };
      
      // Get current images from field card
      const fieldCard = await offlineStorage.getFieldCard(fieldCardId);
      const currentImages = fieldCard.images || [];
      
      // Add new image
      const updatedImages = [...currentImages, newImage];
      
      // Update field card
      await offlineStorage.updateFieldCard(fieldCardId, { images: updatedImages });
      
      // Update state
      setImages(updatedImages);
      
      // Open edit modal to add comment immediately
      setSelectedImage(newImage);
      setImageComment('');
      setEditModalVisible(true);
      
      // Notify parent component
      if (onImagesUpdated) {
        onImagesUpdated(updatedImages);
      }
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an image
  const handleDeleteImage = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      
      // Delete file from filesystem
      await FileSystem.deleteAsync(selectedImage.uri, { idempotent: true });
      
      // Remove from field card
      const updatedImages = images.filter(img => img.id !== selectedImage.id);
      await offlineStorage.updateFieldCard(fieldCardId, { images: updatedImages });
      
      // Update state
      setImages(updatedImages);
      setModalVisible(false);
      setSelectedImage(null);
      
      // Notify parent component
      if (onImagesUpdated) {
        onImagesUpdated(updatedImages);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Failed to delete image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save a comment for an image
  const handleSaveComment = async () => {
    if (!selectedImage) return;
    
    try {
      setIsLoading(true);
      
      // Update the comment for the selected image
      const updatedImages = images.map(img => {
        if (img.id === selectedImage.id) {
          return {
            ...img,
            comment: imageComment
          };
        }
        return img;
      });
      
      // Update field card
      await offlineStorage.updateFieldCard(fieldCardId, { images: updatedImages });
      
      // Update state
      setImages(updatedImages);
      setEditModalVisible(false);
      
      // Notify parent component
      if (onImagesUpdated) {
        onImagesUpdated(updatedImages);
      }
    } catch (error) {
      console.error('Error saving image comment:', error);
      Alert.alert('Error', 'Failed to save comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Open the image preview modal
  const handleImagePress = (image) => {
    setSelectedImage(image);
    setImageComment(image.comment || '');
    setModalVisible(true);
  };

  // Open the edit comment modal
  const handleEditComment = () => {
    setModalVisible(false);
    setEditModalVisible(true);
  };

  // Render an image item in the list
  const renderImageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.imageItem} 
      onPress={() => handleImagePress(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.thumbnail} />
      {item.comment ? (
        <View style={styles.commentIndicator}>
          <Feather name="message-square" size={14} color="#fff" />
        </View>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2c5e2e" />
        </View>
      )}
      
      {/* Header with title and action buttons */}
      <View style={styles.header}>
        <Text style={styles.title}>Field Photos</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleTakePhoto}
          >
            <Feather name="camera" size={18} color="#2c5e2e" />
            <Text style={styles.actionButtonText}>Camera</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleSelectImage}
          >
            <Feather name="image" size={18} color="#2c5e2e" />
            <Text style={styles.actionButtonText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Image gallery */}
      {images.length > 0 ? (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          horizontal={false}
          numColumns={3}
          contentContainerStyle={styles.imageGrid}
        />
      ) : (
        <View style={styles.emptyState}>
          <Feather name="camera-off" size={40} color="#bbb" />
          <Text style={styles.emptyStateText}>No photos added yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Take or select photos to document your field assessment
          </Text>
        </View>
      )}
      
      {/* Image preview modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                
                {selectedImage.comment ? (
                  <View style={styles.modalCommentContainer}>
                    <Text style={styles.modalCommentLabel}>Notes:</Text>
                    <Text style={styles.modalCommentText}>{selectedImage.comment}</Text>
                  </View>
                ) : null}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={handleEditComment}
                  >
                    <Feather name="edit" size={16} color="#fff" />
                    <Text style={styles.modalButtonText}>
                      {selectedImage.comment ? 'Edit Notes' : 'Add Notes'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButton]}
                    onPress={handleDeleteImage}
                  >
                    <Feather name="trash-2" size={16} color="#fff" />
                    <Text style={styles.modalButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
      
      {/* Edit comment modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Image Notes</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Feather name="x" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            {selectedImage && (
              <>
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={styles.editModalImage}
                  resizeMode="cover"
                />
                
                <Text style={styles.commentLabel}>
                  Add notes about this photo:
                </Text>
                
                <TextInput
                  style={styles.commentInput}
                  value={imageComment}
                  onChangeText={setImageComment}
                  placeholder="Describe what's shown in this photo..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#2c5e2e',
    marginLeft: 4,
  },
  imageGrid: {
    padding: 8,
  },
  imageItem: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
  },
  commentIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#2c5e2e',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
  },
  modalCommentContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalCommentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  modalCommentText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 12,
    backgroundColor: '#2c5e2e',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  editModalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  editModalImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    minHeight: 120,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  editModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#555',
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#2c5e2e',
    borderRadius: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ImageCaptureManager;