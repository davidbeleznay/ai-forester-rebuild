import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { nanoid } from 'nanoid/non-secure';

// Storage Keys
const FIELD_CARDS_KEY = '@field_cards';
const FIELD_CARD_PREFIX = '@field_card_';
const PENDING_OPERATIONS_KEY = '@pending_operations';

/**
 * Utility for managing offline data storage and synchronization
 */
const offlineStorage = {
  /**
   * Save a field card to local storage
   * @param {Object} fieldCard - The field card to save
   * @returns {Promise<string>} - ID of the saved field card
   */
  saveFieldCard: async (fieldCard) => {
    try {
      // Generate ID if not present
      if (!fieldCard.id) {
        fieldCard.id = nanoid();
      }
      
      // Add timestamp if not present
      if (!fieldCard.createdAt) {
        fieldCard.createdAt = new Date().toISOString();
      }
      
      fieldCard.updatedAt = new Date().toISOString();
      fieldCard.synced = false;
      
      // Store the field card
      const itemKey = `${FIELD_CARD_PREFIX}${fieldCard.id}`;
      await AsyncStorage.setItem(itemKey, JSON.stringify(fieldCard));
      
      // Update the index of field cards
      const existingIdsString = await AsyncStorage.getItem(FIELD_CARDS_KEY);
      const existingIds = existingIdsString ? JSON.parse(existingIdsString) : [];
      
      if (!existingIds.includes(fieldCard.id)) {
        existingIds.push(fieldCard.id);
        await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(existingIds));
      }
      
      // Add to pending operations if not synced
      await addPendingOperation({
        type: 'save',
        id: fieldCard.id,
        timestamp: new Date().toISOString()
      });
      
      return fieldCard.id;
    } catch (error) {
      console.error('Error saving field card:', error);
      throw new Error('Failed to save field card offline');
    }
  },
  
  /**
   * Get a field card by ID
   * @param {string} id - The ID of the field card to retrieve
   * @returns {Promise<Object>} - The field card object
   */
  getFieldCard: async (id) => {
    try {
      const itemKey = `${FIELD_CARD_PREFIX}${id}`;
      const cardString = await AsyncStorage.getItem(itemKey);
      
      if (!cardString) {
        throw new Error(`Field card with ID ${id} not found`);
      }
      
      return JSON.parse(cardString);
    } catch (error) {
      console.error(`Error getting field card ${id}:`, error);
      throw new Error(`Failed to retrieve field card ${id}`);
    }
  },
  
  /**
   * Get all stored field cards
   * @returns {Promise<Array>} - Array of field card objects
   */
  getAllFieldCards: async () => {
    try {
      const idsString = await AsyncStorage.getItem(FIELD_CARDS_KEY);
      if (!idsString) {
        return [];
      }
      
      const ids = JSON.parse(idsString);
      const fieldCards = [];
      
      for (const id of ids) {
        try {
          const card = await offlineStorage.getFieldCard(id);
          fieldCards.push(card);
        } catch (error) {
          console.warn(`Error retrieving field card ${id}:`, error);
        }
      }
      
      // Sort by updatedAt, most recent first
      return fieldCards.sort((a, b) => {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
    } catch (error) {
      console.error('Error getting all field cards:', error);
      throw new Error('Failed to retrieve field cards');
    }
  },
  
  /**
   * Update an existing field card
   * @param {string} id - The ID of the field card to update
   * @param {Object} updates - The updated field data
   * @returns {Promise<Object>} - The updated field card
   */
  updateFieldCard: async (id, updates) => {
    try {
      // Get the existing field card
      const existingCard = await offlineStorage.getFieldCard(id);
      
      // Apply updates
      const updatedCard = {
        ...existingCard,
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
      };
      
      // Save the updated card
      const itemKey = `${FIELD_CARD_PREFIX}${id}`;
      await AsyncStorage.setItem(itemKey, JSON.stringify(updatedCard));
      
      // Add to pending operations
      await addPendingOperation({
        type: 'update',
        id: id,
        timestamp: new Date().toISOString()
      });
      
      return updatedCard;
    } catch (error) {
      console.error(`Error updating field card ${id}:`, error);
      throw new Error(`Failed to update field card ${id}`);
    }
  },
  
  /**
   * Delete a field card
   * @param {string} id - The ID of the field card to delete
   * @returns {Promise<boolean>} - Success indicator
   */
  deleteFieldCard: async (id) => {
    try {
      // Remove the field card
      const itemKey = `${FIELD_CARD_PREFIX}${id}`;
      await AsyncStorage.removeItem(itemKey);
      
      // Update the index
      const idsString = await AsyncStorage.getItem(FIELD_CARDS_KEY);
      if (idsString) {
        const ids = JSON.parse(idsString);
        const updatedIds = ids.filter(existingId => existingId !== id);
        await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(updatedIds));
      }
      
      // Add to pending operations
      await addPendingOperation({
        type: 'delete',
        id: id,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting field card ${id}:`, error);
      throw new Error(`Failed to delete field card ${id}`);
    }
  },
  
  /**
   * Save an image to local storage
   * @param {string} uri - The URI of the image to save
   * @param {string} fieldCardId - The ID of the associated field card
   * @returns {Promise<string>} - The saved image URI
   */
  saveImage: async (uri, fieldCardId) => {
    try {
      // Create directory if it doesn't exist
      const dirPath = `${FileSystem.documentDirectory}images/${fieldCardId}/`;
      const dirInfo = await FileSystem.getInfoAsync(dirPath);
      
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().getTime();
      const filename = `image_${timestamp}.jpg`;
      const destinationUri = `${dirPath}${filename}`;
      
      // Copy the image to our app's directory
      await FileSystem.copyAsync({
        from: uri,
        to: destinationUri
      });
      
      // Update the field card with the new image
      const fieldCard = await offlineStorage.getFieldCard(fieldCardId);
      const imageUris = fieldCard.imageUris || [];
      imageUris.push(destinationUri);
      
      await offlineStorage.updateFieldCard(fieldCardId, { imageUris });
      
      // Add to pending operations
      await addPendingOperation({
        type: 'saveImage',
        id: fieldCardId,
        imageUri: destinationUri,
        timestamp: new Date().toISOString()
      });
      
      return destinationUri;
    } catch (error) {
      console.error('Error saving image:', error);
      throw new Error('Failed to save image');
    }
  },
  
  /**
   * Delete an image from storage
   * @param {string} uri - The URI of the image to delete
   * @param {string} fieldCardId - The ID of the associated field card
   * @returns {Promise<boolean>} - Success indicator
   */
  deleteImage: async (uri, fieldCardId) => {
    try {
      // Delete the file
      await FileSystem.deleteAsync(uri);
      
      // Update the field card
      const fieldCard = await offlineStorage.getFieldCard(fieldCardId);
      const imageUris = fieldCard.imageUris || [];
      const updatedUris = imageUris.filter(imageUri => imageUri !== uri);
      
      await offlineStorage.updateFieldCard(fieldCardId, { imageUris: updatedUris });
      
      // Add to pending operations
      await addPendingOperation({
        type: 'deleteImage',
        id: fieldCardId,
        imageUri: uri,
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  },
  
  /**
   * Add comment to a field card
   * @param {string} fieldCardId - The ID of the field card
   * @param {string} comment - The comment text
   * @returns {Promise<Object>} - The updated field card
   */
  addComment: async (fieldCardId, comment) => {
    try {
      const fieldCard = await offlineStorage.getFieldCard(fieldCardId);
      
      // Update with the new comment
      const updatedCard = await offlineStorage.updateFieldCard(fieldCardId, { 
        comments: comment,
      });
      
      // Add to pending operations
      await addPendingOperation({
        type: 'addComment',
        id: fieldCardId,
        timestamp: new Date().toISOString()
      });
      
      return updatedCard;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  },
  
  /**
   * Get all pending operations that need to be synced
   * @returns {Promise<Array>} - Array of pending operations
   */
  getPendingOperations: async () => {
    try {
      const operationsString = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
      return operationsString ? JSON.parse(operationsString) : [];
    } catch (error) {
      console.error('Error getting pending operations:', error);
      return [];
    }
  },
  
  /**
   * Clear all pending operations after successful sync
   * @returns {Promise<boolean>} - Success indicator
   */
  clearPendingOperations: async () => {
    try {
      await AsyncStorage.removeItem(PENDING_OPERATIONS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing pending operations:', error);
      return false;
    }
  },
  
  /**
   * Mark a field card as synced
   * @param {string} id - The ID of the field card
   * @returns {Promise<Object>} - The updated field card
   */
  markAsSynced: async (id) => {
    try {
      const fieldCard = await offlineStorage.getFieldCard(id);
      return await offlineStorage.updateFieldCard(id, { 
        synced: true,
        lastSyncedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error marking field card ${id} as synced:`, error);
      throw new Error(`Failed to mark field card ${id} as synced`);
    }
  },
  
  /**
   * Check if the device is online
   * @returns {Promise<boolean>} - Online status
   */
  isOnline: async () => {
    // This is a placeholder - in real app would use NetInfo
    // We import and use the NetInfo package in the NetworkContext
    return true;
  }
};

/**
 * Helper to add a pending operation to the queue
 * @param {Object} operation - The operation details
 * @returns {Promise<boolean>} - Success indicator
 */
const addPendingOperation = async (operation) => {
  try {
    const operationsString = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
    const operations = operationsString ? JSON.parse(operationsString) : [];
    
    operations.push(operation);
    await AsyncStorage.setItem(PENDING_OPERATIONS_KEY, JSON.stringify(operations));
    
    return true;
  } catch (error) {
    console.error('Error adding pending operation:', error);
    return false;
  }
};

export default offlineStorage;