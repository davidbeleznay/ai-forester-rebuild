import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

/**
 * Generate HTML content for PDF report
 * 
 * @param {Object} fieldCard - The field card data
 * @param {Object} options - Additional options for the PDF
 * @param {string} options.comments - User comments about the field card
 * @param {Array<string>} options.images - Array of image URIs
 * @returns {string} - HTML content for the PDF
 */
const generateHtmlContent = (fieldCard, options = {}) => {
  const { comments = "", images = [] } = options;
  
  // Get calculation method-specific measurements
  let measurementsHtml = "";
  if (fieldCard.calculationMethod === 'california') {
    const avgTopWidth = fieldCard.averageTopWidth?.toFixed(2) || 'N/A';
    const avgDepth = fieldCard.averageDepth?.toFixed(2) || 'N/A';
    
    measurementsHtml = `
      <h3>Stream Measurements</h3>
      <table class="data-table">
        <tr>
          <td>Average Top Width:</td>
          <td>${avgTopWidth} m</td>
        </tr>
        <tr>
          <td>Bottom Width:</td>
          <td>${fieldCard.bottomWidth} m</td>
        </tr>
        <tr>
          <td>Average Depth:</td>
          <td>${avgDepth} m</td>
        </tr>
        <tr>
          <td>Cross-sectional Area:</td>
          <td>${fieldCard.crossSectionalArea?.toFixed(2) || 'N/A'} m²</td>
        </tr>
        <tr>
          <td>End Opening Area:</td>
          <td>${fieldCard.endOpeningArea?.toFixed(2) || 'N/A'} m²</td>
        </tr>
      </table>
    `;
  } else {
    measurementsHtml = `
      <h3>Watershed Measurements</h3>
      <table class="data-table">
        <tr>
          <td>Watershed Area:</td>
          <td>${fieldCard.watershedArea} km²</td>
        </tr>
        <tr>
          <td>Precipitation:</td>
          <td>${fieldCard.precipitation} mm/hr</td>
        </tr>
      </table>
    `;
  }
  
  // Water Transport Potential section
  let transportHtml = "";
  if (fieldCard.transportAssessmentUsed) {
    transportHtml = `
      <h3>Water Transport Potential Assessment</h3>
      <table class="data-table">
        <tr>
          <td>Bankfull Width:</td>
          <td>${fieldCard.debrisRating || 'Low'}</td>
        </tr>
        <tr>
          <td>Sediment Rating:</td>
          <td>${fieldCard.sedimentDepthCategory || 'Low'}</td>
        </tr>
        <tr>
          <td>Woody Debris Rating:</td>
          <td>${fieldCard.logDiameterCategory || 'None'}</td>
        </tr>
        <tr>
          <td>Transport Index:</td>
          <td>${fieldCard.transportIndex?.toFixed(1) || 'N/A'}</td>
        </tr>
      </table>
      
      ${fieldCard.transportRecommendation ? `
        <div class="recommendation">
          <strong>Recommendation:</strong> ${fieldCard.transportRecommendation}
        </div>
      ` : ''}
      
      ${fieldCard.transportTips && fieldCard.transportTips.length > 0 ? `
        <div class="tips">
          <strong>Design Recommendations:</strong>
          <ul>
            ${fieldCard.transportTips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      <div class="wtp-warning">
        <strong>Important WTP Guidelines:</strong>
        <ul>
          <li>WTP assessments are not simple averages of parameters</li>
          <li>One critical risk factor dominates the overall assessment</li>
          <li>A single high-instability feature can mobilize major sediment</li>
          <li>Always err on the side of the highest rating</li>
        </ul>
      </div>
    `;
  }
  
  // Climate projection section
  let climateHtml = "";
  if (fieldCard.climateProjectionUsed && fieldCard.climateProjectionFactor > 1.0) {
    const scenario = fieldCard.climateScenario === '2050s' 
      ? '2050s (+10%)' 
      : fieldCard.climateScenario === '2080s'
        ? '2080s (+20%)'
        : fieldCard.climateScenario === 'custom'
          ? 'Custom'
          : 'None';
          
    climateHtml = `
      <h3>Climate Change Projection</h3>
      <table class="data-table">
        <tr>
          <td>Scenario:</td>
          <td>${scenario}</td>
        </tr>
        <tr>
          <td>Uplift Factor:</td>
          <td>${fieldCard.climateProjectionFactor.toFixed(2)} (+${((fieldCard.climateProjectionFactor - 1) * 100).toFixed(0)}%)</td>
        </tr>
      </table>
    `;
  }
  
  // Generate images section if there are images
  let imagesHtml = "";
  if (images.length > 0) {
    imagesHtml = `
      <h3>Site Photos</h3>
      <div class="images-container">
        ${images.map((image, index) => `
          <div class="image-item">
            <img src="${image}" alt="Site photo ${index + 1}" class="site-image" />
            <p>Photo ${index + 1}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Generate comments section if there are comments
  let commentsHtml = "";
  if (comments.trim()) {
    commentsHtml = `
      <h3>Field Notes</h3>
      <div class="comments">
        <p>${comments.replace(/\n/g, '<br/>')}</p>
      </div>
    `;
  }
  
  // The professional design recommendation warning
  let professionalDesignHtml = "";
  if (fieldCard.requiresProfessionalDesign) {
    professionalDesignHtml = `
      <div class="warning-box">
        <h3>Professional Engineering Design Recommended</h3>
        <p>This culvert size exceeds standard sizing limits and may require specialized design.</p>
      </div>
    `;
  }
  
  // Bridge recommendation warning
  let bridgeRecommendationHtml = "";
  if (fieldCard.recommendedSize > 2000) {
    bridgeRecommendationHtml = `
      <div class="warning-box bridge-warning">
        <h3>Bridge Recommended</h3>
        <p>Size exceeds standard culvert dimensions (${fieldCard.recommendedSize} mm). Consider a bridge structure.</p>
      </div>
    `;
  }

  // Main HTML content
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #4a7e3d;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #4a7e3d;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            margin: 0;
          }
          h2 {
            color: #4a7e3d;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-top: 20px;
          }
          h3 {
            color: #4a7e3d;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .data-table td {
            padding: 8px;
            border-bottom: 1px solid #eee;
          }
          .data-table td:first-child {
            width: 50%;
            color: #666;
          }
          .result-box {
            background-color: #f5f5f5;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            border: 1px solid #ddd;
          }
          .result-value {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #4a7e3d;
            margin: 10px 0;
          }
          .warning-box {
            background-color: #fff3cd;
            border-left: 5px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .bridge-warning {
            background-color: #f8d7da;
            border-left: 5px solid #dc3545;
          }
          .recommendation {
            background-color: #e6f7ff;
            padding: 10px;
            border-radius: 4px;
            margin: 15px 0;
          }
          .tips {
            margin: 15px 0;
          }
          .tips ul, .wtp-warning ul {
            margin-top: 5px;
            padding-left: 20px;
          }
          .wtp-warning {
            background-color: #fff3cd;
            padding: 10px;
            border-radius: 4px;
            margin-top: 15px;
            font-size: 0.9em;
          }
          .images-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 15px;
          }
          .image-item {
            flex: 1;
            min-width: 200px;
            max-width: 300px;
            text-align: center;
          }
          .site-image {
            width: 100%;
            height: auto;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
          .comments {
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #eee;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Culvert Sizing Report</h1>
          <p>AI Forester Field Companion App</p>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <h2>Site Information</h2>
        <table class="data-table">
          <tr>
            <td>Stream/Culvert ID:</td>
            <td>${fieldCard.streamId}</td>
          </tr>
          <tr>
            <td>Location:</td>
            <td>${fieldCard.location || 'Not specified'}</td>
          </tr>
          ${fieldCard.gpsCoordinates ? `
            <tr>
              <td>GPS Coordinates:</td>
              <td>${fieldCard.gpsCoordinates.latitude.toFixed(5)}, ${fieldCard.gpsCoordinates.longitude.toFixed(5)}</td>
            </tr>
          ` : ''}
          <tr>
            <td>Date Created:</td>
            <td>${new Date(fieldCard.dateCreated).toLocaleDateString()}</td>
          </tr>
        </table>

        <h2>Calculation Results</h2>
        ${professionalDesignHtml}
        ${bridgeRecommendationHtml}
        
        <div class="result-box">
          <h3>Recommended Culvert Size</h3>
          <div class="result-value">${fieldCard.recommendedSize} mm</div>
          <p style="text-align: center;">(${(fieldCard.recommendedSize/1000).toFixed(2)} meters)</p>
          
          <table class="data-table">
            <tr>
              <td>Cross-sectional Area:</td>
              <td>${fieldCard.crossSectionalArea?.toFixed(2) || 'N/A'} m²</td>
            </tr>
            <tr>
              <td>Flow Capacity:</td>
              <td>${fieldCard.flowCapacity?.toFixed(2) || 'N/A'} m³/s</td>
            </tr>
          </table>
        </div>
        
        <h2>Input Parameters</h2>
        ${measurementsHtml}
        ${transportHtml}
        ${climateHtml}
        ${commentsHtml}
        ${imagesHtml}
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} AI Forester Field Companion</p>
        </div>
      </body>
    </html>
  `;
};

/**
 * Generate a PDF report from fieldcard data
 * 
 * @param {Object} fieldCard - The field card data
 * @param {Object} options - Options for the PDF
 * @param {string} options.filename - Filename for the PDF
 * @param {string} options.comments - User comments
 * @param {Array<string>} options.images - Array of image URIs
 * @returns {Promise<string>} - Path to the generated PDF file
 */
export const generatePDF = async (fieldCard, options = {}) => {
  try {
    const {
      filename = `Culvert_${fieldCard.streamId}_${new Date().toISOString().split('T')[0]}`,
      comments = '',
      images = []
    } = options;
    
    // Generate HTML
    const html = generateHtmlContent(fieldCard, { comments, images });
    
    // Generate PDF file
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false
    });
    
    // For iOS, we need to save the file to a permanent location
    // since the Print module creates the file in a temporary directory
    let finalUri = uri;
    if (Platform.OS === 'ios') {
      const pdfDir = `${FileSystem.documentDirectory}pdfs/`;
      const dirExists = await FileSystem.getInfoAsync(pdfDir);
      
      if (!dirExists.exists) {
        await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });
      }
      
      finalUri = `${pdfDir}${filename}.pdf`;
      await FileSystem.moveAsync({
        from: uri,
        to: finalUri
      });
    }
    
    return finalUri;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Share a PDF file
 * 
 * @param {string} uri - Path to the PDF file
 * @param {Object} options - Options for sharing
 * @param {string} options.title - Share sheet title
 * @returns {Promise<void>}
 */
export const sharePDF = async (uri, options = {}) => {
  try {
    const { title = 'Share Culvert Report' } = options;
    
    // Check if file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('PDF file does not exist');
    }
    
    // Share the PDF
    await shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: title,
      UTI: 'com.adobe.pdf'
    });
  } catch (error) {
    console.error('Error sharing PDF:', error);
    throw error;
  }
};

/**
 * Save PDF to device
 * 
 * @param {string} uri - Path to the PDF file
 * @returns {Promise<void>}
 */
export const savePDFToDevice = async (uri) => {
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Storage permission is needed to save the PDF to your device.');
      return;
    }
    
    // Save to media library
    await MediaLibrary.saveToLibraryAsync(uri);
    
    Alert.alert('Success', 'PDF has been saved to your device.');
  } catch (error) {
    console.error('Error saving PDF to device:', error);
    Alert.alert('Error', 'Failed to save PDF to your device.');
    throw error;
  }
};

export default {
  generatePDF,
  sharePDF,
  savePDFToDevice
};
