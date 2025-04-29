// Storage Utility for saving and retrieving assessments
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const ASSESSMENT_KEY_PREFIX = '@AIForester:assessment:';
const ASSESSMENT_IDS_KEY = '@AIForester:assessmentIds';

/**
 * Save form data to AsyncStorage
 * @param {Object} data - The assessment data to save
 * @returns {Promise<void>}
 */
export const saveFormData = async (data) => {
  try {
    if (!data.id) {
      throw new Error('Assessment data must have an ID');
    }

    // Get existing assessment IDs
    const existingIdsString = await AsyncStorage.getItem(ASSESSMENT_IDS_KEY);
    const existingIds = existingIdsString ? JSON.parse(existingIdsString) : [];
    
    // Add this assessment ID if it doesn't exist already
    if (!existingIds.includes(data.id)) {
      existingIds.push(data.id);
      await AsyncStorage.setItem(ASSESSMENT_IDS_KEY, JSON.stringify(existingIds));
    }
    
    // Save the assessment data
    const key = `${ASSESSMENT_KEY_PREFIX}${data.id}`;
    await AsyncStorage.setItem(key, JSON.stringify(data));
    
    return data.id;
  } catch (error) {
    console.error('Error saving form data:', error);
    throw new Error(`Failed to save assessment: ${error.message}`);
  }
};

/**
 * Get all saved assessment IDs
 * @returns {Promise<string[]>} Array of assessment IDs
 */
export const getAssessmentIds = async () => {
  try {
    const idsString = await AsyncStorage.getItem(ASSESSMENT_IDS_KEY);
    return idsString ? JSON.parse(idsString) : [];
  } catch (error) {
    console.error('Error getting assessment IDs:', error);
    return [];
  }
};

/**
 * Get a specific assessment by ID
 * @param {string} id - The assessment ID
 * @returns {Promise<Object|null>} The assessment data or null if not found
 */
export const getAssessment = async (id) => {
  try {
    const key = `${ASSESSMENT_KEY_PREFIX}${id}`;
    const dataString = await AsyncStorage.getItem(key);
    return dataString ? JSON.parse(dataString) : null;
  } catch (error) {
    console.error(`Error getting assessment ${id}:`, error);
    return null;
  }
};

/**
 * Get all saved assessments
 * @returns {Promise<Object[]>} Array of assessment data objects
 */
export const getAllAssessments = async () => {
  try {
    const ids = await getAssessmentIds();
    const assessments = [];
    
    for (const id of ids) {
      const assessment = await getAssessment(id);
      if (assessment) {
        assessments.push(assessment);
      }
    }
    
    // Sort by timestamp (newest first)
    return assessments.sort((a, b) => {
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  } catch (error) {
    console.error('Error getting all assessments:', error);
    return [];
  }
};

/**
 * Delete an assessment by ID
 * @param {string} id - The assessment ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteAssessment = async (id) => {
  try {
    // Remove from IDs list
    const idsString = await AsyncStorage.getItem(ASSESSMENT_IDS_KEY);
    const ids = idsString ? JSON.parse(idsString) : [];
    const updatedIds = ids.filter(existingId => existingId !== id);
    await AsyncStorage.setItem(ASSESSMENT_IDS_KEY, JSON.stringify(updatedIds));
    
    // Delete the actual assessment data
    const key = `${ASSESSMENT_KEY_PREFIX}${id}`;
    await AsyncStorage.removeItem(key);
    
    return true;
  } catch (error) {
    console.error(`Error deleting assessment ${id}:`, error);
    return false;
  }
};

/**
 * Clear all stored assessments
 * @returns {Promise<boolean>} Success status
 */
export const clearAllAssessments = async () => {
  try {
    const ids = await getAssessmentIds();
    
    // Delete each assessment
    for (const id of ids) {
      const key = `${ASSESSMENT_KEY_PREFIX}${id}`;
      await AsyncStorage.removeItem(key);
    }
    
    // Clear the IDs list
    await AsyncStorage.removeItem(ASSESSMENT_IDS_KEY);
    
    return true;
  } catch (error) {
    console.error('Error clearing all assessments:', error);
    return false;
  }
};