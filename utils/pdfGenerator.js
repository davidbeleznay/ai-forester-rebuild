// PDF Generator Utility
import * as FileSystem from 'expo-file-system';
import { Alert, Share } from 'react-native';

/**
 * Generates a PDF report from assessment data
 * @param {Object} data - The assessment data to include in the PDF
 * @returns {Promise<string>} - The URI of the generated PDF
 */
export const generatePDF = async (data) => {
  try {
    // Create a simple mock PDF for testing purposes
    // In a real implementation, this would use a library like react-native-html-to-pdf
    
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `culvert-assessment-${timestamp}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Create a text representation of the PDF content
    let content = `# ${data.title || 'Culvert Assessment Report'}\n`;
    content += `Date: ${new Date(data.timestamp).toLocaleString()}\n\n`;
    
    // Location information
    if (data.location) {
      content += '## Location\n';
      content += `Latitude: ${data.location.latitude}\n`;
      content += `Longitude: ${data.location.longitude}\n`;
      if (data.location.accuracy) {
        content += `Accuracy: ±${data.location.accuracy}m\n`;
      }
      content += '\n';
    }
    
    // Input parameters
    content += '## Input Parameters\n';
    Object.entries(data.inputs || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Format the key for display
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1') // Add spaces before capital letters
          .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
        
        content += `${formattedKey}: ${value}\n`;
      }
    });
    content += '\n';
    
    // Results
    content += '## Results\n';
    Object.entries(data.results || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        // Format the key for display
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        
        content += `${formattedKey}: ${value}\n`;
      }
    });
    content += '\n';
    
    // Transport assessment if included
    if (data.transportAssessment) {
      content += '## Transport Assessment\n';
      Object.entries(data.transportAssessment).forEach(([key, value]) => {
        if (key !== 'recommendations' && value !== null && value !== undefined) {
          const formattedKey = key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          
          content += `${formattedKey}: ${value}\n`;
        }
      });
      
      // Recommendations
      if (data.transportAssessment.recommendations && 
          data.transportAssessment.recommendations.length > 0) {
        content += '\n### Recommendations\n';
        data.transportAssessment.recommendations.forEach((rec, index) => {
          content += `${index + 1}. ${rec}\n`;
        });
      }
      content += '\n';
    }
    
    // Notes
    if (data.notes) {
      content += '## Notes\n';
      content += `${data.notes}\n\n`;
    }
    
    // Photo information
    if (data.photos && data.photos.length > 0) {
      content += `## Photos (${data.photos.length})\n`;
      data.photos.forEach((photo, index) => {
        content += `Photo ${index + 1}: ${photo.timestamp}\n`;
        if (photo.comment) {
          content += `Comment: ${photo.comment}\n`;
        }
        content += '\n';
      });
    }
    
    // In a real implementation, this content would be converted to a PDF
    // For now, we'll just save it as a text file
    await FileSystem.writeAsStringAsync(fileUri, content);
    
    // Return the URI of the generated file
    return fileUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Shares a PDF file using the native share dialog
 * @param {string} fileUri - The URI of the PDF file to share
 * @param {string} title - The title to use for the share dialog
 */
export const sharePDF = async (fileUri, title = 'Culvert Assessment Report') => {
  try {
    const shareOptions = {
      title,
      url: `file://${fileUri}`,
      message: 'Check out this culvert assessment report.',
    };
    
    await Share.share(shareOptions);
  } catch (error) {
    Alert.alert('Error Sharing', 'Failed to share the PDF report.');
    console.error('Error sharing PDF:', error);
  }
};
