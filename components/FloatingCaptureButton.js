import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Text,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { nanoid } from 'nanoid';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Floating capture button component
 * Provides quick access to camera and photo picker from anywhere in the app
 * Saves captured images to the temporary storage for later association with field cards
 */
const FloatingCaptureButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  // Toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Capture image from camera
  const handleCaptureImage = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos.');
        return;
      }

      setIsMenuOpen(false);
      setIsLoading(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImageToTempStorage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Select image from library
  const handleSelectImage = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
        return;
      }

      setIsMenuOpen(false);
      setIsLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImageToTempStorage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save image to temporary storage
  const saveImageToTempStorage = async (uri) => {
    try {
      // Create directory if it doesn't exist
      const tempDir = `${FileSystem.documentDirectory}temp_images/`;
      const dirInfo = await FileSystem.getInfoAsync(tempDir);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
      }

      // Generate unique filename
      const imageId = nanoid();
      const timestamp = new Date().toISOString();
      const filename = `image_${imageId}.jpg`;
      const destUri = `${tempDir}${filename}`;

      // Copy image to app storage
      await FileSystem.copyAsync({
        from: uri,
        to: destUri
      });

      // Save image info to AsyncStorage for later use
      const imageInfo = {
        id: imageId,
        uri: destUri,
        timestamp,
        comment: '',
        isAssociated: false
      };

      // Get existing temp images
      const existingImagesJson = await AsyncStorage.getItem('@temp_images');
      const existingImages = existingImagesJson ? JSON.parse(existingImagesJson) : [];

      // Add new image to list
      const updatedImages = [...existingImages, imageInfo];
      await AsyncStorage.setItem('@temp_images', JSON.stringify(updatedImages));

      // Show success message
      Alert.alert(
        'Photo Captured',
        'Photo saved successfully. You can associate it with a field card later.',
        [
          { 
            text: 'OK',
            onPress: () => {}
          },
          {
            text: 'View Photos',
            onPress: () => navigation.navigate('PhotoGallery')
          }
        ]
      );
    } catch (error) {
      console.error('Error saving image to temp storage:', error);
      Alert.alert('Error', 'Failed to save image. Please try again.');
    }
  };

  // Render loading overlay
  const renderLoading = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.loadingOverlay}>
        <ActivityIndicator size="large" color="#2c5e2e" />
        <Text style={styles.loadingText}>Processing image...</Text>
      </View>
    );
  };

  return (
    <>
      {/* Main floating button */}
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.button}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Action menu modal */}
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleCaptureImage}
            >
              <Feather name="camera" size={20} color="#2c5e2e" />
              <Text style={styles.menuItemText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleSelectImage}
            >
              <Feather name="image" size={20} color="#2c5e2e" />
              <Text style={styles.menuItemText}>Select from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('PhotoGallery');
              }}
            >
              <Feather name="folder" size={20} color="#2c5e2e" />
              <Text style={styles.menuItemText}>View Photos</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Loading overlay */}
      {renderLoading()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2c5e2e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 5,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  }
});

export default FloatingCaptureButton;
