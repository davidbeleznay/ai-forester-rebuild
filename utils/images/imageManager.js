import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';

/**
 * Request camera/media library permissions
 * 
 * @returns {Promise<boolean>} - Whether permission was granted
 */
export const requestMediaPermissions = async () => {
  try {
    // Request camera permission
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    // Request media library permission
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    return cameraPermission.status === 'granted' && mediaLibraryPermission.status === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Take a photo with device camera
 * 
 * @returns {Promise<Object|null>} - Image info or null if canceled
 */
export const takePhoto = async () => {
  try {
    // Check permissions
    const hasPermission = await requestMediaPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Camera permission is needed to take photos.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

/**
 * Select image from device library
 * 
 * @returns {Promise<Object|null>} - Image info or null if canceled
 */
export const selectImage = async () => {
  try {
    // Check permissions
    const hasPermission = await requestMediaPermissions();
    
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Media library permission is needed to select photos.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });
    
    if (result.canceled) {
      return null;
    }
    
    return result.assets[0];
  } catch (error) {
    console.error('Error selecting image:', error);
    Alert.alert('Error', 'Failed to select image. Please try again.');
    return null;
  }
};

/**
 * Save image to app's permanent storage
 * 
 * @param {Object} image - The image object returned from ImagePicker
 * @param {string} fieldCardId - The ID of the field card to associate with the image
 * @returns {Promise<string>} - URI of the saved image
 */
export const saveImageToStorage = async (image, fieldCardId) => {
  try {
    if (!image || !image.uri) {
      throw new Error('Invalid image object');
    }
    
    // Create directory for field card images if it doesn't exist
    const imagesDir = `${FileSystem.documentDirectory}field_cards/${fieldCardId}/images/`;
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(imagesDir, { intermediates: true });
    }
    
    // Generate filename based on timestamp
    const filename = `image_${Date.now()}.jpg`;
    const newUri = `${imagesDir}${filename}`;
    
    // Copy image to permanent storage
    await FileSystem.copyAsync({
      from: image.uri,
      to: newUri
    });
    
    return newUri;
  } catch (error) {
    console.error('Error saving image to storage:', error);
    throw error;
  }
};

/**
 * Get all images for a specific field card
 * 
 * @param {string} fieldCardId - The ID of the field card
 * @returns {Promise<Array<string>>} - Array of image URIs
 */
export const getFieldCardImages = async (fieldCardId) => {
  try {
    // Path to the field card images directory
    const imagesDir = `${FileSystem.documentDirectory}field_cards/${fieldCardId}/images/`;
    
    // Check if directory exists
    const dirInfo = await FileSystem.getInfoAsync(imagesDir);
    if (!dirInfo.exists) {
      return [];
    }
    
    // Read directory content
    const files = await FileSystem.readDirectoryAsync(imagesDir);
    
    // Filter for image files and create full URIs
    const imageFiles = files.filter(filename => 
      filename.endsWith('.jpg') || 
      filename.endsWith('.jpeg') || 
      filename.endsWith('.png')
    );
    
    return imageFiles.map(filename => `${imagesDir}${filename}`);
  } catch (error) {
    console.error('Error getting field card images:', error);
    return [];
  }
};

/**
 * Delete an image
 * 
 * @param {string} imageUri - URI of the image to delete
 * @returns {Promise<boolean>} - Whether the deletion was successful
 */
export const deleteImage = async (imageUri) => {
  try {
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (!fileInfo.exists) {
      return false;
    }
    
    // Delete the file
    await FileSystem.deleteAsync(imageUri);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

export default {
  takePhoto,
  selectImage,
  saveImageToStorage,
  getFieldCardImages,
  deleteImage,
  requestMediaPermissions
};
