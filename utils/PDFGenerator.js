// PDFGenerator.js - Utility for PDF generation
import * as FileSystem from 'expo-file-system';
import { Alert, Share } from 'react-native';

// Export as a default object for compatibility with existing imports
const PDFGenerator = {
  /**
   * Generates and shares a PDF from assessment data
   * @param {Object} fieldCard - Basic assessment data
   * @param {number} recommendedSize - Culvert size in mm
   * @param {number} culvertArea - Area in m²
   * @param {number} flowCapacity - Flow capacity in m³/s
   * @param {string} calculationMethod - 'california' or 'area-based'
   * @param {boolean} requiresProfessionalDesign - Whether professional engineering is needed
   * @param {Array} photos - Assessment photos
   * @returns {Promise<string>} - The URI of the generated file
   */
  generateAndSharePDF: async (
    fieldCard,
    recommendedSize,
    culvertArea,
    flowCapacity,
    calculationMethod,
    requiresProfessionalDesign,
    photos = []
  ) => {
    try {
      // Create a timestamp for the filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `culvert-assessment-${timestamp}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Create a text representation of the report content
      let content = `# Culvert Assessment Field Report\\n\\n`;
      content += `Date: ${new Date().toLocaleString()}\\n\\n`;
      
      // Stream identification
      if (fieldCard && fieldCard.streamId) {
        content += `## Stream Identification\\n`;
        content += `Stream ID: ${fieldCard.streamId || 'Unnamed Assessment'}\\n\\n`;
      }
      
      // GPS coordinates
      if (fieldCard && fieldCard.gpsCoordinates) {
        content += `## Location\\n`;
        const { latitude, longitude, accuracy } = fieldCard.gpsCoordinates;
        content += `Latitude: ${latitude ? latitude.toFixed(6) : 'N/A'}\\n`;
        content += `Longitude: ${longitude ? longitude.toFixed(6) : 'N/A'}\\n`;
        if (accuracy) {
          content += `Accuracy: ±${accuracy.toFixed(1)}m\\n`;
        }
        content += '\\n';
      }
      
      // Calculation method
      content += `## Calculation Method\\n`;
      content += `Method: ${calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}\\n\\n`;
      
      // Results
      content += `## Results\\n`;
      content += `Recommended Culvert Size: ${recommendedSize} mm\\n`;
      content += `Culvert Area: ${culvertArea ? culvertArea.toFixed(2) : 'N/A'} m²\\n`;
      content += `Flow Capacity: ${flowCapacity ? flowCapacity.toFixed(2) : 'N/A'} m³/s\\n`;
      
      if (requiresProfessionalDesign) {
        content += `\\n⚠️ PROFESSIONAL ENGINEERING DESIGN REQUIRED ⚠️\\n`;
        content += `The recommended culvert size exceeds standard installation parameters. Professional engineering design is required for this installation.\\n\\n`;
      }
      
      // Comments/Notes
      if (fieldCard && fieldCard.comments) {
        content += `## Field Notes\\n`;
        content += `${fieldCard.comments}\\n\\n`;
      }
      
      // Photos
      if (photos && photos.length > 0) {
        content += `## Photos (${photos.length})\\n`;
        photos.forEach((photo, index) => {
          content += `Photo ${index + 1}: ${photo.timestamp || 'No timestamp'}\\n`;
          if (photo.comment) {
            content += `Comment: ${photo.comment}\\n`;
          }
          content += '\\n';
        });
      }
      
      // Save the file
      await FileSystem.writeAsStringAsync(fileUri, content);
      
      // Share the report
      await Share.share({
        title: 'Culvert Assessment Report',
        url: `file://${fileUri}`,
        message: 'Culvert Assessment Report'
      });
      
      return fileUri;
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', `Failed to generate report: ${error.message}`);
      throw error;
    }
  }
};

export default PDFGenerator;