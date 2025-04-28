import AsyncStorage from '@react-native-async-storage/async-storage';

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
    };
    
    // Add new card to the array
    const updatedCards = [...existingCards, cardToSave];
    
    // Save updated array back to storage
    await AsyncStorage.setItem(FIELD_CARDS_KEY, JSON.stringify(updatedCards));
    
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
    return true;
  } catch (error) {
    console.error('Error clearing field cards:', error);
    return false;
  }
};
