import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Platform } from 'react-native';

/**
 * Enhanced PDF Generator with support for images and comments
 * Creates PDF reports with field data, comments, and images for documentation
 */
const enhancedPDFGenerator = {
  /**
   * Generate a PDF report with field data, comments, and images
   * @param {Object} fieldData - The field data to include in the report
   * @param {string} comments - General comments about the assessment
   * @param {Array} images - Array of image objects with URIs and comments
   * @returns {Promise<string>} - The URI of the generated PDF
   */
  generatePDF: async (fieldData, comments = '', images = []) => {
    try {
      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ai-forester-report-${timestamp}.pdf`;
      
      // Generate HTML content with images
      const htmlContent = await enhancedPDFGenerator.createHTMLTemplate(fieldData, comments, images);
      
      // Generate PDF using expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });
      
      // On iOS, URI is already in the right format
      // On Android, ensure proper file path
      let pdfUri = uri;
      if (Platform.OS === 'android') {
        const destinationUri = FileSystem.documentDirectory + fileName;
        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri,
        });
        pdfUri = destinationUri;
      }
      
      return pdfUri;
    } catch (error) {
      console.error('Error generating enhanced PDF:', error);
      throw new Error('Failed to generate PDF report with images');
    }
  },
  
  /**
   * Share the generated PDF with other apps
   * @param {string} pdfUri - The URI of the PDF to share
   * @returns {Promise<void>}
   */
  sharePDF: async (pdfUri) => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing is not available on this device');
      }
      
      await Sharing.shareAsync(pdfUri);
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error('Failed to share PDF report');
    }
  },
  
  /**
   * Create HTML template for the PDF report
   * @param {Object} fieldData - The field data
   * @param {string} comments - General comments about the assessment
   * @param {Array} images - Array of image objects with URIs and comments
   * @returns {Promise<string>} - HTML content as a string
   */
  createHTMLTemplate: async (fieldData, comments, images) => {
    // Extract relevant data from fieldData
    const {
      location = {},
      streamMeasurements = {},
      culvertResults = {},
      transportAssessment = {},
      timestamp = new Date().toLocaleString(),
    } = fieldData;
    
    // Prepare images for HTML embedding
    let imagesHTML = '';
    
    if (images && images.length > 0) {
      try {
        // Process each image
        for (const image of images) {
          if (!image.uri) continue;
          
          // Read image as base64
          const base64Data = await FileSystem.readAsStringAsync(image.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Get image type from URI
          const imageType = image.uri.endsWith('.png') ? 'png' : 'jpeg';
          
          // Create HTML for this image with its comment
          imagesHTML += `
            <div class="image-container">
              <img src="data:image/${imageType};base64,${base64Data}" class="field-image" />
              ${image.comment ? `
                <div class="image-caption">
                  <p>${image.comment}</p>
                </div>
              ` : ''}
            </div>
          `;
        }
      } catch (error) {
        console.error('Error processing images for PDF:', error);
        // Add error message to the report
        imagesHTML = '<p class="error-text">Error loading images. Some images may not be displayed.</p>';
      }
    }
    
    // Create HTML content
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AI Forester Field Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              color: #333; 
              line-height: 1.5; 
              margin: 0; 
              padding: 20px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              padding-bottom: 10px;
              border-bottom: 2px solid #2c5e2e;
            }
            .logo { 
              max-width: 150px; 
            }
            h1 { 
              color: #2c5e2e; 
              font-size: 24px; 
              margin-bottom: 10px; 
            }
            h2 { 
              color: #2c5e2e; 
              font-size: 18px; 
              margin-top: 20px; 
              margin-bottom: 10px; 
              padding-bottom: 5px;
              border-bottom: 1px solid #ddd;
            }
            .section { 
              margin-bottom: 20px; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 15px; 
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left; 
            }
            th { 
              background-color: #f2f2f2; 
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 10px;
              text-align: center; 
              font-size: 12px; 
              color: #777; 
              border-top: 1px solid #ddd;
            }
            .comments { 
              background-color: #f9f9f9; 
              padding: 10px; 
              border-left: 4px solid #2c5e2e; 
              margin-bottom: 20px;
            }
            .image-section { 
              margin-top: 20px; 
            }
            .image-container {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .field-image {
              max-width: 100%;
              max-height: 300px;
              border: 1px solid #ddd;
            }
            .image-caption {
              background-color: #f5f5f5;
              padding: 8px;
              border: 1px solid #ddd;
              border-top: none;
              font-size: 14px;
            }
            .error-text {
              color: #f44336;
              font-style: italic;
            }
            .page-break {
              page-break-after: always;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .page-break {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AI Forester Field Report</h1>
            <p>Generated on: ${timestamp}</p>
          </div>

          <div class="section">
            <h2>Location Information</h2>
            <table>
              <tr>
                <th>Latitude</th>
                <td>${location.latitude || 'N/A'}</td>
              </tr>
              <tr>
                <th>Longitude</th>
                <td>${location.longitude || 'N/A'}</td>
              </tr>
              <tr>
                <th>Elevation</th>
                <td>${location.elevation || 'N/A'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>Stream Measurements</h2>
            <table>
              <tr>
                <th>Average Top Width</th>
                <td>${streamMeasurements.avgTopWidth || 'N/A'} m</td>
              </tr>
              <tr>
                <th>Average Depth</th>
                <td>${streamMeasurements.avgDepth || 'N/A'} m</td>
              </tr>
              <tr>
                <th>Bottom Width</th>
                <td>${streamMeasurements.bottomWidth || 'N/A'} m</td>
              </tr>
              <tr>
                <th>Cross-sectional Area</th>
                <td>${streamMeasurements.crossSectionalArea || 'N/A'} m²</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>Culvert Results</h2>
            <table>
              <tr>
                <th>Recommended Culvert Size</th>
                <td>${culvertResults.recommendedSize || 'N/A'}</td>
              </tr>
              <tr>
                <th>Calculation Method</th>
                <td>${culvertResults.calculationMethod || 'N/A'}</td>
              </tr>
              <tr>
                <th>Required Opening Area</th>
                <td>${culvertResults.requiredOpeningArea || 'N/A'} m²</td>
              </tr>
              <tr>
                <th>Professional Design Required</th>
                <td>${culvertResults.professionalDesignRequired ? 'Yes' : 'No'}</td>
              </tr>
            </table>
          </div>

          <div class="section">
            <h2>Transport and Debris Assessment</h2>
            <table>
              <tr>
                <th>Bankfull Width Rating</th>
                <td>${transportAssessment.bankfullWidthRating || 'N/A'}</td>
              </tr>
              <tr>
                <th>Sediment in Storage Wedges</th>
                <td>${transportAssessment.sedimentRating || 'N/A'}</td>
              </tr>
              <tr>
                <th>Water-transported Woody Debris</th>
                <td>${transportAssessment.woodyDebrisRating || 'N/A'}</td>
              </tr>
              <tr>
                <th>Transport Index</th>
                <td>${transportAssessment.transportIndex || 'N/A'}</td>
              </tr>
              <tr>
                <th>Recommendations</th>
                <td>${transportAssessment.recommendations || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          ${comments ? `
          <div class="section">
            <h2>Field Notes</h2>
            <div class="comments">
              <p>${comments}</p>
            </div>
          </div>
          ` : ''}
          
          ${images && images.length > 0 ? `
          <div class="page-break"></div>
          <div class="section image-section">
            <h2>Field Photos</h2>
            ${imagesHTML}
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated by AI Forester Field Companion App</p>
          </div>
        </body>
      </html>
    `;
  },
  
  /**
   * Generate a plain text report when PDF generation is unavailable
   * @param {Object} fieldData - The field data
   * @param {string} comments - General comments
   * @param {Array} images - Array of image objects
   * @returns {Promise<string>} - URI of the generated text file
   */
  generateTextReport: async (fieldData, comments = '', images = []) => {
    try {
      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `ai-forester-report-${timestamp}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Generate text content
      let textContent = "AI FORESTER FIELD REPORT\n";
      textContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
      
      // Add field data sections
      textContent += "LOCATION INFORMATION\n";
      if (fieldData.location) {
        textContent += `Latitude: ${fieldData.location.latitude || 'N/A'}\n`;
        textContent += `Longitude: ${fieldData.location.longitude || 'N/A'}\n`;
        textContent += `Elevation: ${fieldData.location.elevation || 'N/A'}\n`;
      }
      textContent += "\n";
      
      // Add stream measurements
      textContent += "STREAM MEASUREMENTS\n";
      if (fieldData.streamMeasurements) {
        textContent += `Average Top Width: ${fieldData.streamMeasurements.avgTopWidth || 'N/A'} m\n`;
        textContent += `Average Depth: ${fieldData.streamMeasurements.avgDepth || 'N/A'} m\n`;
        textContent += `Bottom Width: ${fieldData.streamMeasurements.bottomWidth || 'N/A'} m\n`;
        textContent += `Cross-sectional Area: ${fieldData.streamMeasurements.crossSectionalArea || 'N/A'} m²\n`;
      }
      textContent += "\n";
      
      // Add culvert results
      textContent += "CULVERT RESULTS\n";
      if (fieldData.culvertResults) {
        textContent += `Recommended Culvert Size: ${fieldData.culvertResults.recommendedSize || 'N/A'}\n`;
        textContent += `Calculation Method: ${fieldData.culvertResults.calculationMethod || 'N/A'}\n`;
        textContent += `Required Opening Area: ${fieldData.culvertResults.requiredOpeningArea || 'N/A'} m²\n`;
        textContent += `Professional Design Required: ${fieldData.culvertResults.professionalDesignRequired ? 'Yes' : 'No'}\n`;
      }
      textContent += "\n";
      
      // Add transport assessment
      textContent += "TRANSPORT AND DEBRIS ASSESSMENT\n";
      if (fieldData.transportAssessment) {
        textContent += `Bankfull Width Rating: ${fieldData.transportAssessment.bankfullWidthRating || 'N/A'}\n`;
        textContent += `Sediment in Storage Wedges: ${fieldData.transportAssessment.sedimentRating || 'N/A'}\n`;
        textContent += `Water-transported Woody Debris: ${fieldData.transportAssessment.woodyDebrisRating || 'N/A'}\n`;
        textContent += `Transport Index: ${fieldData.transportAssessment.transportIndex || 'N/A'}\n`;
        textContent += `Recommendations: ${fieldData.transportAssessment.recommendations || 'N/A'}\n`;
      }
      textContent += "\n";
      
      // Add comments if provided
      if (comments && comments.trim()) {
        textContent += "FIELD NOTES\n";
        textContent += `${comments}\n\n`;
      }
      
      // Add image information
      if (images && images.length > 0) {
        textContent += "FIELD PHOTOS\n";
        textContent += `Number of photos: ${images.length}\n`;
        
        // List image details
        images.forEach((image, index) => {
          if (image.comment) {
            textContent += `\nPhoto ${index + 1} notes: ${image.comment}\n`;
          }
        });
        
        textContent += "\nNote: Images cannot be displayed in text format. Please view the PDF report to see images.\n\n";
      }
      
      textContent += "---------------------------------------\n";
      textContent += "Generated by AI Forester Field Companion App";
      
      // Write the file
      await FileSystem.writeAsStringAsync(fileUri, textContent);
      
      return fileUri;
    } catch (error) {
      console.error('Error generating text report:', error);
      throw new Error('Failed to generate text report');
    }
  }
};

export default enhancedPDFGenerator;