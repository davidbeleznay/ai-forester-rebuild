// PDF Generator Utility (Capitalized version)
import * as FileSystem from 'expo-file-system';
import { Alert, Share } from 'react-native';

/**
 * PDFGenerator - Handles PDF generation and sharing functionality
 */
const PDFGenerator = {
  /**
   * Generates and shares a PDF for a culvert assessment
   * @param {Object} fieldCard - Basic field card data
   * @param {number} recommendedSize - Recommended culvert size in mm
   * @param {number} culvertArea - Culvert area in square meters
   * @param {number} flowCapacity - Flow capacity in cubic meters per second
   * @param {string} calculationMethod - Method used ('california' or 'area-based')
   * @param {boolean} requiresProfessionalDesign - Whether professional design is required
   * @param {Array} photos - Array of photo objects
   * @returns {Promise<void>}
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
      
      // Create a text representation of the PDF content
      let content = `# Culvert Assessment Field Report\n\n`;
      content += `Date: ${new Date().toLocaleString()}\n\n`;
      
      // Stream identification
      if (fieldCard.streamId) {
        content += `## Stream Identification\n`;
        content += `Stream ID: ${fieldCard.streamId}\n\n`;
      }
      
      // GPS coordinates
      if (fieldCard.gpsCoordinates) {
        content += `## Location\n`;
        const { latitude, longitude, accuracy } = fieldCard.gpsCoordinates;
        content += `Latitude: ${latitude.toFixed(6)}\n`;
        content += `Longitude: ${longitude.toFixed(6)}\n`;
        if (accuracy) {
          content += `Accuracy: ±${accuracy.toFixed(1)}m\n`;
        }
        content += '\n';
      }
      
      // Calculation method
      content += `## Calculation Method\n`;
      content += `Method: ${calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}\n\n`;
      
      // Input parameters - California Method
      if (calculationMethod === 'california') {
        content += `## California Method Parameters\n`;
        content += `Average Top Width: ${fieldCard.averageTopWidth} m\n`;
        content += `Depth: ${fieldCard.depth} m\n`;
        content += `Bottom Width: ${fieldCard.bottomWidth} m\n`;
        content += `Cross-Sectional Area: ${fieldCard.crossSectionalArea.toFixed(2)} m²\n`;
        
        if (fieldCard.climateFactorEnabled) {
          content += `Climate Factor: ${fieldCard.climateFactor}x\n`;
        }
        content += '\n';
      }
      
      // Input parameters - Area-Based Method
      if (calculationMethod === 'area-based') {
        content += `## Area-Based Method Parameters\n`;
        content += `Watershed Area: ${fieldCard.watershedArea} ha\n`;
        content += `Precipitation: ${fieldCard.precipitation} mm/hr\n`;
        content += `Runoff Coefficient: ${fieldCard.runoffCoefficient}\n`;
        
        if (fieldCard.climateFactorEnabled) {
          content += `Climate Factor: ${fieldCard.climateFactor}x\n`;
        }
        content += '\n';
      }
      
      // Results
      content += `## Results\n`;
      content += `Recommended Culvert Size: ${recommendedSize} mm\n`;
      content += `Culvert Area: ${culvertArea.toFixed(2)} m²\n`;
      content += `Flow Capacity: ${flowCapacity.toFixed(2)} m³/s\n`;
      
      if (requiresProfessionalDesign) {
        content += `\n⚠️ PROFESSIONAL ENGINEERING DESIGN REQUIRED ⚠️\n`;
        content += `The recommended culvert size exceeds standard installation parameters. Professional engineering design is required for this installation.\n\n`;
      }
      
      // Transport assessment if available
      if (fieldCard.transportAssessment) {
        content += `## Transport Assessment\n`;
        content += `Risk Category: ${fieldCard.transportAssessment.riskCategory}\n`;
        content += `Score: ${fieldCard.transportAssessment.score}/9\n`;
        content += `Additional Sizing Factor: ${(fieldCard.transportAssessment.sizingFactor * 100).toFixed(0)}%\n`;
        
        // Recommendations
        if (fieldCard.transportAssessment.recommendations && 
            fieldCard.transportAssessment.recommendations.length > 0) {
          content += `\n### Recommendations\n`;
          fieldCard.transportAssessment.recommendations.forEach((rec, index) => {
            content += `${index + 1}. ${rec}\n`;
          });
        }
        content += '\n';
      }
      
      // Comments/Notes
      if (fieldCard.comments) {
        content += `## Field Notes\n`;
        content += `${fieldCard.comments}\n\n`;
      }
      
      // Photos
      if (photos && photos.length > 0) {
        content += `## Photos (${photos.length})\n`;
        photos.forEach((photo, index) => {
          content += `Photo ${index + 1}: ${photo.timestamp || 'No timestamp'}\n`;
          if (photo.comment) {
            content += `Comment: ${photo.comment}\n`;
          }
          content += '\n';
        });
      }
      
      // In a real implementation, this content would be converted to a PDF
      // For now, we'll just save it as a text file
      await FileSystem.writeAsStringAsync(fileUri, content);
      
      // Share the generated file
      await PDFGenerator.sharePDF(fileUri);
      
      return fileUri;
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', `Failed to generate PDF: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Shares a PDF file using the native share dialog
   * @param {string} fileUri - The URI of the file to share
   */
  sharePDF: async (fileUri) => {
    try {
      const shareOptions = {
        title: 'Culvert Assessment Report',
        url: `file://${fileUri}`,
        message: 'Please review this culvert assessment report.',
      };
      
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error Sharing', 'Failed to share the report.');
      throw error;
    }
  }
};

export default PDFGenerator;