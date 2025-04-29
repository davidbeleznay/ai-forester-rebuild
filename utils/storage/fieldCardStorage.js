import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import NetworkManager from '../NetworkManager';

// Constants
const FIELD_CARDS_KEY = 'ai-forester-field-cards';

/**
 * Field Card Storage Utility
 * Handles saving, retrieving, and managing field data cards
 */

/**
 * Save a new field card to local storage
 * 
 * @param {Object} fieldCard - Field card data object
 * @returns {Promise<string>} - Promise resolving to the ID of the saved card
 */
export const saveFieldCard = async (fieldCard) => {
  try {
    // Get existing cards
    const existingCards = await getFieldCards();
    
    // Generate a unique ID if not provided
    const cardToSave = {
      ...fieldCard,
      id: fieldCard.id || `card_${Date.now()}`,
      createdAt: fieldCard.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: fieldCard.comments || '',
      imageUris: fieldCard.imageUris || []
    };
    
    // Add new card to the array
    const updatedCards = [...existingCards, cardToSave];
    
    // Save updated array back to storage
    await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(updatedCards));
    
    // Create directory for field card if it doesn't exist
    await ensureFieldCardDirectory(cardToSave.id);
    
    return cardToSave.id;
  } catch (error) {
    console.error('Error saving field card:', error);
    throw error;
  }
};

/**
 * Get all saved field cards
 * 
 * @returns {Promise<Array>} - Promise resolving to array of field card objects
 */
export const getFieldCards = async () => {
  try {
    const cardsJson = await AsyncStorage.getItem(FIELD_CARDS_KEY);
    return cardsJson ? JSON.parse(cardsJson) : [];
  } catch (error) {
    console.error('Error retrieving field cards:', error);
    return [];
  }
};

/**
 * Get a specific field card by ID
 * 
 * @param {string} id - Field card ID
 * @returns {Promise<Object|null>} - Promise resolving to field card object or null if not found
 */
export const getFieldCardById = async (id) => {
  try {
    const cards = await getFieldCards();
    return cards.find(card => card.id === id) || null;
  } catch (error) {
    console.error('Error retrieving field card by ID:', error);
    return null;
  }
};

/**
 * Update an existing field card
 * 
 * @param {string} id - Field card ID to update
 * @param {Object} updatedData - New field card data
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const updateFieldCard = async (id, updatedData) => {
  try {
    const cards = await getFieldCards();
    const cardIndex = cards.findIndex(card => card.id === id);
    
    if (cardIndex === -1) {
      return false;
    }
    
    // Update the card with new data
    cards[cardIndex] = {
      ...cards[cardIndex],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated array back to storage
    await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(cards));
    
    return true;
  } catch (error) {
    console.error('Error updating field card:', error);
    return false;
  }
};

/**
 * Add a comment to a field card
 * 
 * @param {string} id - Field card ID
 * @param {string} comment - Comment text to add
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const addComment = async (id, comment) => {
  try {
    const card = await getFieldCardById(id);
    
    if (!card) {
      return false;
    }
    
    // Update card with new comment
    return await updateFieldCard(id, {
      comments: comment
    });
  } catch (error) {
    console.error('Error adding comment to field card:', error);
    return false;
  }
};

/**
 * Add an image to a field card
 * 
 * @param {string} id - Field card ID
 * @param {string} imageUri - URI of the image to add
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const addImageToFieldCard = async (id, imageUri) => {
  try {
    const card = await getFieldCardById(id);
    
    if (!card) {
      return false;
    }
    
    // Get current images
    const currentImages = card.imageUris || [];
    
    // Update card with new image
    return await updateFieldCard(id, {
      imageUris: [...currentImages, imageUri]
    });
  } catch (error) {
    console.error('Error adding image to field card:', error);
    return false;
  }
};

/**
 * Remove an image from a field card
 * 
 * @param {string} id - Field card ID
 * @param {string} imageUri - URI of the image to remove
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const removeImageFromFieldCard = async (id, imageUri) => {
  try {
    const card = await getFieldCardById(id);
    
    if (!card || !card.imageUris) {
      return false;
    }
    
    // Filter out the image to remove
    const updatedImages = card.imageUris.filter(uri => uri !== imageUri);
    
    // Update the card
    const updateResult = await updateFieldCard(id, {
      imageUris: updatedImages
    });
    
    // Delete the image file
    if (updateResult) {
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      } catch (deleteError) {
        console.error('Error deleting image file:', deleteError);
        // Continue even if file deletion fails
      }
    }
    
    return updateResult;
  } catch (error) {
    console.error('Error removing image from field card:', error);
    return false;
  }
};

/**
 * Ensure the field card directory exists for storing associated files
 * 
 * @param {string} id - Field card ID
 * @returns {Promise<string>} - Promise resolving to the directory path
 */
export const ensureFieldCardDirectory = async (id) => {
  try {
    const directoryPath = `${FileSystem.documentDirectory}field_cards/${id}/`;
    const dirInfo = await FileSystem.getInfoAsync(directoryPath);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
    }
    
    return directoryPath;
  } catch (error) {
    console.error('Error ensuring field card directory:', error);
    throw error;
  }
};

/**
 * Delete a field card by ID
 * 
 * @param {string} id - Field card ID to delete
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const deleteFieldCard = async (id) => {
  try {
    const cards = await getFieldCards();
    const filteredCards = cards.filter(card => card.id !== id);
    
    // If no cards were removed, return false
    if (filteredCards.length === cards.length) {
      return false;
    }
    
    // Save updated array back to storage
    await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(filteredCards));
    
    // Delete associated directory and files
    try {
      const directoryPath = `${FileSystem.documentDirectory}field_cards/${id}/`;
      const dirInfo = await FileSystem.getInfoAsync(directoryPath);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(directoryPath, { idempotent: true });
      }
    } catch (deleteError) {
      console.error('Error deleting field card directory:', deleteError);
      // Continue even if directory deletion fails
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting field card:', error);
    return false;
  }
};

/**
 * Clear all field cards from storage
 * 
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const clearAllFieldCards = async () => {
  try {
    await AsyncStorage.removeItem(FIELD_CARDS_KEY);
    
    // Delete all field card directories
    try {
      const baseDir = `${FileSystem.documentDirectory}field_cards/`;
      const dirInfo = await FileSystem.getInfoAsync(baseDir);
      
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(baseDir, { idempotent: true });
      }
    } catch (deleteError) {
      console.error('Error deleting field cards directory:', deleteError);
      // Continue even if directory deletion fails
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing field cards:', error);
    return false;
  }
};

/**
 * Check if the device has internet connection
 * Using the NetworkManager for more robust connection checking
 * 
 * @returns {Promise<boolean>} - Promise resolving to connection status
 */
export const isOnline = async () => {
  try {
    return await NetworkManager.isConnected();
  } catch (error) {
    console.error('Error checking online status:', error);
    // Default to true to ensure functionality isn't blocked
    return true;
  }
};
