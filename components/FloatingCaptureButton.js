import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  Text,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import { nanoid } from 'nanoid';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Enhanced Floating capture button component
 * Provides quick access to camera and photo picker from anywhere in the app
 * Includes visual feedback and animation effects for better user experience
 */
const FloatingCaptureButton = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const navigation = useNavigation();

  // Start pulsing animation to draw user attention
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Toggle the menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  /**
   * Verify all necessary permissions for camera usage
   * @returns {Promise<boolean>} Whether permissions were granted
   */
  const verifyCameraPermissions = async () => {
    try {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (cameraStatus !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Camera permission is required to capture photos.', 
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // On some platforms, we can redirect to settings
                // This is just a placeholder as implementation varies by platform
                Alert.alert('Please open your device settings to enable camera permissions');
              }
            }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      Alert.alert('Error', 'Failed to verify camera permissions. Please try again.');
      return false;
    }
  };

  /**
   * Verify media library permissions for accessing photos
   * @returns {Promise<boolean>} Whether permissions were granted
   */
  const verifyMediaLibraryPermissions = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Media library permission is required to select photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => {
                // On some platforms, we can redirect to settings
                // This is just a placeholder as implementation varies by platform
                Alert.alert('Please open your device settings to enable media library permissions');
              }
            }
          ]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking media library permissions:', error);
      Alert.alert('Error', 'Failed to verify media library permissions. Please try again.');
      return false;
    }
  };

  // Capture image from camera with enhanced error handling
  const handleCaptureImage = async () => {
    try {
      // Verify permissions
      const hasPermission = await verifyCameraPermissions();
      if (!hasPermission) return;

      setIsMenuOpen(false);
      setIsLoading(true);

      // Define options with correct enum values
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        // Set explicit aspect ratio to avoid issues on some devices
        aspect: [4, 3],
      };

      // Launch camera with proper error handling
      const result = await ImagePicker.launchCameraAsync(options);

      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImageToTempStorage(result.assets[0].uri);
      } else if (result.canceled) {
        // User canceled - no need for error message
        console.log('Camera capture canceled by user');
      } else {
        // Something else went wrong
        throw new Error('No image was captured or returned from the camera');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert(
        'Camera Error', 
        'Failed to capture image: ' + (error.message || 'Unknown error'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Select image from library with enhanced error handling
  const handleSelectImage = async () => {
    try {
      // Verify permissions
      const hasPermission = await verifyMediaLibraryPermissions();
      if (!hasPermission) return;

      setIsMenuOpen(false);
      setIsLoading(true);

      // Define options with correct enum values
      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        // Set explicit aspect ratio to avoid issues on some devices
        aspect: [4, 3],
      };

      // Launch image picker with proper error handling
      const result = await ImagePicker.launchImageLibraryAsync(options);

      // Handle result
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await saveImageToTempStorage(result.assets[0].uri);
      } else if (result.canceled) {
        // User canceled - no need for error message
        console.log('Image selection canceled by user');
      } else {
        // Something else went wrong
        throw new Error('No image was selected or returned from the gallery');
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Gallery Error', 
        'Failed to select image: ' + (error.message || 'Unknown error'),
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Save image to temporary storage with enhanced error handling
  const saveImageToTempStorage = async (uri) => {
    try {
      // First, check if the source uri is valid
      const sourceInfo = await FileSystem.getInfoAsync(uri);
      if (!sourceInfo.exists) {
        throw new Error('Source image file not found');
      }

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

      // Verify the image was copied successfully
      const destInfo = await FileSystem.getInfoAsync(destUri);
      if (!destInfo.exists) {
        throw new Error('Failed to copy image to app storage');
      }

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
      Alert.alert(
        'Storage Error',
        'Failed to save image: ' + (error.message || 'Unknown error'),
        [{ text: 'OK' }]
      );
      throw error; // Rethrow to handle in the calling function
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
      {/* Main floating button with animation */}
      <View style={styles.container}>
        <Animated.View style={{
          transform: [
            { scale: pulseAnim }
          ],
        }}>
          <TouchableOpacity 
            style={styles.button}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <Feather name="camera" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Small hint text above button */}
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Capture</Text>
        </View>
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
              <Feather name="camera" size={22} color="#2c5e2e" />
              <Text style={styles.menuItemText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleSelectImage}
            >
              <Feather name="image" size={22} color="#2c5e2e" />
              <Text style={styles.menuItemText}>Select from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                navigation.navigate('PhotoGallery');
              }}
            >
              <Feather name="folder" size={22} color="#2c5e2e" />
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
    bottom: 25,
    right: 25,
    zIndex: 100,
    alignItems: 'center',
  },
  button: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#2c5e2e',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  hintContainer: {
    backgroundColor: 'rgba(44, 94, 46, 0.8)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    position: 'absolute',
    top: -25,
  },
  hintText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
    fontWeight: '500',
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