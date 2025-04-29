/**
 * PDF Generator Utility
 * Handles creating and sharing PDF reports from field data
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

/**
 * Generate a PDF report for a field card
 * 
 * @param {Object} fieldCard - The field card data
 * @param {number} culvertDiameter - Recommended culvert diameter in mm
 * @param {number} crossSectionalArea - Cross-sectional area in m²
 * @param {number} flowCapacity - Flow capacity in m³/s
 * @param {string} calculationMethod - Method used ('california' or 'area-based')
 * @param {boolean} requiresProfessionalDesign - Whether professional design is recommended
 * @param {Array} images - Array of image objects with uri and comment properties
 * @returns {Promise<Object>} - Promise resolving to { success, uri, error }
 */
export const generatePDF = async (
  fieldCard,
  culvertDiameter,
  crossSectionalArea,
  flowCapacity,
  calculationMethod,
  requiresProfessionalDesign = false,
  images = []
) => {
  try {
    // Process images if provided
    const processedImages = await Promise.all(
      images.map(async (img) => {
        if (!img.uri) return null;
        
        try {
          // Read image as base64
          const base64 = await FileSystem.readAsStringAsync(img.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          return {
            base64,
            comment: img.comment || '',
          };
        } catch (err) {
          console.error('Error processing image:', err);
          return null;
        }
      })
    );
    
    // Filter out failed images
    const validImages = processedImages.filter(img => img !== null);
    
    // Flag for showing bridge recommendation
    const showBridgeRecommendation = culvertDiameter >= 2000;
    
    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              font-size: 24px;
              color: #2E7D32;
              margin-bottom: 20px;
            }
            h2 {
              font-size: 18px;
              color: #2E7D32;
              margin-top: 30px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            .data-section {
              margin-bottom: 20px;
            }
            .data-row {
              display: flex;
              margin-bottom: 8px;
            }
            .data-label {
              font-weight: bold;
              min-width: 180px;
            }
            .data-value {
              flex: 1;
            }
            .result-value {
              font-size: 20px;
              font-weight: bold;
              color: #2E7D32;
              margin: 10px 0;
            }
            .notes-section {
              background-color: #f5f5f5;
              padding: 15px;
              border-left: 4px solid #2E7D32;
              margin: 20px 0;
            }
            .image-container {
              margin-top: 20px;
              page-break-inside: avoid;
            }
            .field-image {
              max-width: 100%;
              margin-bottom: 10px;
              border: 1px solid #ddd;
            }
            .image-comment {
              font-style: italic;
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f9f9f9;
              border-left: 3px solid #2E7D32;
            }
            .warning {
              background-color: #FFF8E1;
              border-left: 4px solid #FFC107;
              padding: 15px;
              margin-top: 20px;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #777;
              text-align: center;
              border-top: 1px solid #eee;
              padding-top: 10px;
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
          <h1>AI Forester Field Report</h1>
          
          <div class="data-section">
            <h2>Site Information</h2>
            <div class="data-row">
              <div class="data-label">Stream/Culvert ID:</div>
              <div class="data-value">${fieldCard.streamId || 'Not specified'}</div>
            </div>
            <div class="data-row">
              <div class="data-label">Location:</div>
              <div class="data-value">${fieldCard.location || 'Not specified'}</div>
            </div>
            ${fieldCard.gpsCoordinates ? `
              <div class="data-row">
                <div class="data-label">GPS Coordinates:</div>
                <div class="data-value">${fieldCard.gpsCoordinates.latitude.toFixed(5)}, ${fieldCard.gpsCoordinates.longitude.toFixed(5)}</div>
              </div>
            ` : ''}
            <div class="data-row">
              <div class="data-label">Date:</div>
              <div class="data-value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>
          
          <div class="data-section">
            <h2>Calculation Results</h2>
            <div class="data-row">
              <div class="data-label">Recommended Culvert Size:</div>
              <div class="data-value">
                <div class="result-value">${culvertDiameter} mm (${(culvertDiameter/1000).toFixed(2)} m)</div>
              </div>
            </div>
            <div class="data-row">
              <div class="data-label">Cross-sectional Area:</div>
              <div class="data-value">${crossSectionalArea.toFixed(2)} m²</div>
            </div>
            <div class="data-row">
              <div class="data-label">Flow Capacity:</div>
              <div class="data-value">${flowCapacity.toFixed(2)} m³/s</div>
            </div>
            <div class="data-row">
              <div class="data-label">Calculation Method:</div>
              <div class="data-value">${calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}</div>
            </div>
            ${requiresProfessionalDesign ? `
              <div class="warning">
                <strong>Note:</strong> Professional engineering design is recommended for this installation.
              </div>
            ` : ''}
            ${showBridgeRecommendation ? `
              <div class="warning">
                <strong>Bridge Recommended:</strong> Size exceeds standard culvert dimensions (${culvertDiameter} mm).
              </div>
            ` : ''}
          </div>
          
          <div class="data-section">
            <h2>Input Parameters</h2>
            ${calculationMethod === 'california' ? `
              <h3>Stream Measurements</h3>
              <div class="data-row">
                <div class="data-label">Average Top Width:</div>
                <div class="data-value">${fieldCard.averageTopWidth.toFixed(2)} m</div>
              </div>
              <div class="data-row">
                <div class="data-label">Bottom Width:</div>
                <div class="data-value">${fieldCard.bottomWidth} m</div>
              </div>
              <div class="data-row">
                <div class="data-label">Average Depth:</div>
                <div class="data-value">${fieldCard.averageDepth.toFixed(2)} m</div>
              </div>
              <div class="data-row">
                <div class="data-label">Cross-sectional Area:</div>
                <div class="data-value">${fieldCard.crossSectionalArea.toFixed(2)} m²</div>
              </div>
            ` : `
              <h3>Watershed Parameters</h3>
              <div class="data-row">
                <div class="data-label">Watershed Area:</div>
                <div class="data-value">${fieldCard.watershedArea} km²</div>
              </div>
              <div class="data-row">
                <div class="data-label">Precipitation:</div>
                <div class="data-value">${fieldCard.precipitation} mm/hr</div>
              </div>
            `}
          </div>
          
          ${fieldCard.comments ? `
            <div class="notes-section">
              <h2>Field Notes</h2>
              <p>${fieldCard.comments}</p>
            </div>
          ` : ''}
          
          ${validImages.length > 0 ? `
            <div class="page-break"></div>
            <div class="data-section">
              <h2>Field Photos</h2>
              ${validImages.map((img, index) => `
                <div class="image-container">
                  <h3>Photo ${index + 1}</h3>
                  <img src="data:image/jpeg;base64,${img.base64}" class="field-image" />
                  ${img.comment ? `<div class="image-comment">${img.comment}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="footer">
            <p>Generated by AI Forester Field Companion App • ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });
    
    return { success: true, uri };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Share a PDF file using the device's share functionality
 * 
 * @param {string} uri - URI of the PDF file to share
 * @returns {Promise<boolean>} - Promise resolving to success status
 */
export const sharePDF = async (uri) => {
  try {
    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (!isSharingAvailable) {
      Alert.alert(
        'Sharing not available',
        'Sharing is not available on this device'
      );
      return false;
    }
    
    // Share the PDF
    await Sharing.shareAsync(uri);
    return true;
  } catch (error) {
    console.error('Error sharing PDF:', error);
    Alert.alert('Error', 'Could not share PDF. Please try again.');
    return false;
  }
};

/**
 * Generates and shares a PDF report in one step
 * 
 * @param {Object} fieldCard - The field card data
 * @param {number} culvertDiameter - Recommended culvert diameter in mm
 * @param {number} crossSectionalArea - Cross-sectional area in m²
 * @param {number} flowCapacity - Flow capacity in m³/s
 * @param {string} calculationMethod - Method used ('california' or 'area-based')
 * @param {boolean} requiresProfessionalDesign - Whether professional design is recommended
 * @param {Array} images - Array of image objects with uri and comment properties
 * @returns {Promise<Object>} - Promise resolving to { success, uri, error }
 */
export const generateAndSharePDF = async (
  fieldCard,
  culvertDiameter,
  crossSectionalArea,
  flowCapacity,
  calculationMethod,
  requiresProfessionalDesign = false,
  images = []
) => {
  try {
    const { success, uri, error } = await generatePDF(
      fieldCard,
      culvertDiameter,
      crossSectionalArea,
      flowCapacity,
      calculationMethod,
      requiresProfessionalDesign,
      images
    );
    
    if (!success) {
      throw new Error(error || 'Failed to generate PDF');
    }
    
    await sharePDF(uri);
    return { success: true, uri };
  } catch (error) {
    console.error('Error in generate and share PDF:', error);
    Alert.alert('Error', 'Could not generate or share PDF. Please try again.');
    return { success: false, error: error.message };
  }
};

export default {
  generatePDF,
  sharePDF,
  generateAndSharePDF
};