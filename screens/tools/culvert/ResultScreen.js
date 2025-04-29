import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  Image,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Feather } from '@expo/vector-icons';

// Import utilities
import { 
  calculateCrossSectionalArea,
  calculateFlowCapacity,
  assessCulvertSizing,
  getCulvertSizeDescription
} from '../../../utils/calculations/culvertCalculator';
import { 
  saveFieldCard, 
  updateFieldCard, 
  getFieldCardById, 
  addComment, 
  addImageToFieldCard, 
  removeImageFromFieldCard,
  isOnline
} from '../../../utils/storage/fieldCardStorage';
import imageManager from '../../../utils/images/imageManager';
import { generateReport, shareReport } from '../../../utils/reportGenerator';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';

// Import custom components
import CommentInput from '../../../components/CommentInput';
import ExportButton from '../../../components/ExportButton';
import EnhancedReportGenerator from '../../../components/EnhancedReportGenerator';

/**
 * Culvert Tool Result Screen
 * Displays the culvert sizing results with visualization
 */
const ResultScreen = ({ route, navigation }) => {
  // Get data from navigation params
  const { 
    fieldCard: initialFieldCard, 
    culvertDiameter, 
    requiresProfessionalDesign, 
    calculationMethod,
    transportParams,
    climateScenario
  } = route.params || {};
  
  const [fieldCard, setFieldCard] = useState(initialFieldCard);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [quickCaptureModalVisible, setQuickCaptureModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageComment, setImageComment] = useState('');
  
  const { width } = useWindowDimensions();
  
  // Check if we have transport and climate data
  const hasTransportData = fieldCard.transportAssessmentUsed || false;
  const hasClimateData = fieldCard.climateProjectionUsed || false;
  
  // Updated standard culvert sizes for visualization - including all requested commercial sizes
  const standardSizes = [600, 700, 800, 900, 1000, 1200, 1400, 1500, 1600, 1800, 1900, 2000];
  
  // Flag for showing bridge recommendation
  const showBridgeRecommendation = culvertDiameter >= 2000;
  const PROFESSIONAL_ENGINEERING_THRESHOLD = 2000;

  // Load field card data and check connection status
  useEffect(() => {
    loadFieldCardData();
    checkConnectionStatus();
  }, []);

  // Check connection status periodically
  useEffect(() => {
    const intervalId = setInterval(checkConnectionStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Load field card data with comments and images
  const loadFieldCardData = async () => {
    if (fieldCard.id) {
      try {
        setIsLoading(true);
        
        // Get the latest data
        const latestData = await getFieldCardById(fieldCard.id);
        
        if (latestData) {
          setFieldCard(latestData);
          setComments(latestData.comments || '');
        }
      } catch (error) {
        console.error('Error loading field card data:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Check online/offline status
  const checkConnectionStatus = async () => {
    const online = await isOnline();
    setIsOnlineStatus(online);
  };
  
  // If no data passed, show error
  if (!fieldCard || !culvertDiameter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: No calculation data found</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate additional values if not already provided in fieldCard
  const crossSectionalArea = fieldCard.crossSectionalArea || calculateCrossSectionalArea(culvertDiameter);
  const flowCapacity = calculateFlowCapacity(
    culvertDiameter,
    parseFloat(fieldCard.channelSlope || 0.02) // Default to 2% if not provided
  );
  const sizingAssessment = assessCulvertSizing(
    culvertDiameter,
    culvertDiameter // Using same value as we calculated it
  );
  const culvertDescription = getCulvertSizeDescription(culvertDiameter);
  
  // Save comments
  const handleSaveComments = async () => {
    if (!fieldCard.id) {
      await handleSave(); // Save the field card first to get an ID
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update comments
      await addComment(fieldCard.id, comments);
      
      // Refresh data
      await loadFieldCardData();
      
      Alert.alert('Success', 'Comments saved successfully.');
    } catch (error) {
      console.error('Error saving comments:', error);
      Alert.alert('Error', 'Failed to save comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle saving field card
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Add calculated results to field card if not already included
      const cardToSave = {
        ...fieldCard,
        crossSectionalArea: fieldCard.crossSectionalArea || crossSectionalArea,
        flowCapacity,
        sizingAssessment,
        comments
      };
      
      // Save or update field card
      let cardId;
      if (cardToSave.id) {
        await updateFieldCard(cardToSave.id, cardToSave);
        cardId = cardToSave.id;
      } else {
        cardId = await saveFieldCard(cardToSave);
      }
      
      // Update state with saved card
      const savedCard = await getFieldCardById(cardId);
      if (savedCard) {
        setFieldCard(savedCard);
      }
      
      Alert.alert(
        'Saved Successfully',
        'This field card has been saved and can be accessed from your history.',
        [{ text: 'OK' }]
      );
      
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving field card:', error);
      Alert.alert('Error', 'Failed to save the field card. Please try again.');
      setIsSaving(false);
    }
  };
  
  // Generate a direct PDF report without using EnhancedReportGenerator
  const handleDirectPDF = async () => {
    try {
      setIsLoading(true);
      
      // Check if field card is saved
      if (!fieldCard.id) {
        Alert.alert(
          'Save Required',
          'Please save the field card first before generating a PDF.',
          [
            {
              text: 'Save Now',
              onPress: async () => {
                await handleSave();
                if (fieldCard.id) {
                  generatePDF();
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return;
      }
      
      await generatePDF();
    } catch (error) {
      console.error('Error with direct PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate PDF directly
  const generatePDF = async () => {
    try {
      // Get images if field card has them
      const currentFieldCard = await getFieldCardById(fieldCard.id);
      const images = currentFieldCard.images || [];
      
      // Process images
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
            
            ${comments ? `
              <div class="notes-section">
                <h2>Field Notes</h2>
                <p>${comments}</p>
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
      
      // Share the PDF
      await Sharing.shareAsync(uri);
      
      return { success: true, uri };
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
      return { success: false, error: error.message };
    }
  };
  
  // Find closest standard size for visualization
  const getClosestStandardSize = (size) => {
    // If it's a standard size, return it
    if (standardSizes.includes(size)) {
      return size;
    }
    
    // Find the closest standard size
    let closestSize = standardSizes[0];
    let minDiff = Math.abs(size - closestSize);
    
    for (let i = 1; i < standardSizes.length; i++) {
      const diff = Math.abs(size - standardSizes[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestSize = standardSizes[i];
      }
    }
    
    return closestSize;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.connectionStatus}>
          <View 
            style={[
              styles.statusIndicator, 
              isOnlineStatus ? styles.onlineIndicator : styles.offlineIndicator
            ]} 
          />
          <Text style={styles.statusText}>
            {isOnlineStatus ? 'Online' : 'Offline - Data will sync when connection is restored'}
          </Text>
        </View>
        
        <Text style={styles.title}>Culvert Sizing Results</Text>
        
        {requiresProfessionalDesign && (
          <View style={styles.professionalDesignBanner}>
            <Text style={styles.professionalDesignText}>
              Professional Engineering Design Recommended
            </Text>
            <Text style={styles.professionalDesignSubtext}>
              This culvert size exceeds standard sizing limits and may require specialized design.
            </Text>
          </View>
        )}
        
        {/* Project Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Site Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stream/Culvert ID:</Text>
            <Text style={styles.infoValue}>{fieldCard.streamId}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{fieldCard.location || 'Not specified'}</Text>
          </View>
          
          {fieldCard.gpsCoordinates && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GPS Coordinates:</Text>
              <Text style={styles.infoValue}>
                {fieldCard.gpsCoordinates.latitude.toFixed(5)}, {fieldCard.gpsCoordinates.longitude.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Results */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calculation Results</Text>
          
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Recommended Culvert Size</Text>
            <Text style={styles.resultValueLarge}>{culvertDiameter} mm</Text>
            <Text style={styles.resultSubtext}>({(culvertDiameter/1000).toFixed(2)} meters)</Text>
          </View>
          
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Cross-sectional Area</Text>
              <Text style={styles.resultValue}>{crossSectionalArea.toFixed(2)} m²</Text>
            </View>
            
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>Flow Capacity</Text>
              <Text style={styles.resultValue}>{flowCapacity.toFixed(2)} m³/s</Text>
            </View>
          </View>
          
          {/* Visualization */}
          <View style={styles.visualizationContainer}>
            {showBridgeRecommendation ? (
              /* Bridge recommendation visualization */
              <View style={styles.bridgeRecommendation}>
                <View style={styles.xContainer}>
                  <View style={styles.xLine1} />
                  <View style={styles.xLine2} />
                </View>
                <View style={styles.bridgeIcon}>
                  <View style={styles.bridgeDeck} />
                  <View style={styles.bridgePillarLeft} />
                  <View style={styles.bridgePillarRight} />
                </View>
                <Text style={styles.bridgeRecommendationText}>
                  BRIDGE RECOMMENDED
                </Text>
                <Text style={styles.bridgeRecommendationSize}>
                  Size exceeds standard culvert dimensions ({culvertDiameter} mm)
                </Text>
              </View>
            ) : (
              /* Concentric circles visualization for standard and non-standard sizes */
              <View style={styles.circlesContainer}>
                {standardSizes.map((size, index) => {
                  // For non-standard sizes, show the closest standard size with special indicator
                  const isExactSize = size === culvertDiameter;
                  const isClosestSize = !isExactSize && 
                                       !standardSizes.includes(culvertDiameter) && 
                                       size === getClosestStandardSize(culvertDiameter);
                  const isHighlighted = isExactSize || isClosestSize;
                  const circleDiameter = (size / 10); // Scale factor for visualization
                  
                  return (
                    <View 
                      key={`circle-${size}`} 
                      style={[
                        styles.circleSize,
                        {
                          width: circleDiameter,
                          height: circleDiameter,
                          borderRadius: circleDiameter / 2,
                          borderColor: isHighlighted ? COLORS.primary : COLORS.border,
                          borderWidth: isHighlighted ? 3 : 1,
                          backgroundColor: isHighlighted ? `${COLORS.primary}20` : 'transparent',
                          position: 'absolute',
                          zIndex: standardSizes.length - index,
                        }
                      ]}
                    >
                      {isHighlighted && (
                        <Text style={styles.selectedSizeText}>
                          {isClosestSize ? `~${size}mm` : `${size}mm`}
                        </Text>
                      )}
                    </View>
                  );
                })}
                
                {/* If it's a non-standard size, add an indicator showing the exact size */}
                {!standardSizes.includes(culvertDiameter) && !showBridgeRecommendation && (
                  <View style={styles.nonStandardSizeIndicator}>
                    <Text style={styles.nonStandardSizeText}>
                      Actual size: {culvertDiameter}mm
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Sizes Legend */}
          <View style={styles.sizeLegend}>
            <Text style={styles.legendTitle}>Standard Culvert Sizes (mm):</Text>
            <View style={styles.sizesRow}>
              {standardSizes.map(size => {
                // For non-standard sizes, highlight the closest standard size
                const isHighlighted = size === culvertDiameter || 
                                    (!standardSizes.includes(culvertDiameter) && 
                                     size === getClosestStandardSize(culvertDiameter));
                
                return (
                  <View 
                    key={`legend-${size}`} 
                    style={[
                      styles.sizeLegendItem,
                      isHighlighted ? styles.selectedSizeLegendItem : null
                    ]}
                  >
                    <Text 
                      style={[
                        styles.sizeText,
                        isHighlighted ? styles.selectedSizeText : null
                      ]}
                    >
                      {size}
                    </Text>
                  </View>
                );
              })}
              <View 
                style={[
                  styles.sizeLegendItem,
                  showBridgeRecommendation ? styles.selectedSizeLegendItem : null  
                ]}
              >
                <Text 
                  style={[
                    styles.sizeText,
                    showBridgeRecommendation ? styles.selectedSizeText : null  
                  ]}
                >
                  2000+
                </Text>
              </View>
            </View>
          </View>

          {/* Professional Engineering Recommendation */}
          {culvertDiameter >= PROFESSIONAL_ENGINEERING_THRESHOLD && (
            <View style={styles.engineeringNote}>
              <Feather name="alert-triangle" size={20} color={COLORS.warning} style={styles.warningIcon} />
              <Text style={styles.engineeringNoteText}>
                Sizes 2000mm or larger require professional engineering design
              </Text>
            </View>
          )}
        </View>
        
        {/* Field Notes Section - Updated with new CommentInput component */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Notes</Text>
          
          {/* Using the new CommentInput component */}
          <CommentInput 
            value={comments}
            onChangeText={setComments}
          />
          
          <TouchableOpacity
            style={styles.commentSaveButton}
            onPress={handleSaveComments}
          >
            <Text style={styles.commentSaveText}>Save Notes</Text>
          </TouchableOpacity>
        </View>
        
        {/* Action Buttons - Updated with Direct PDF button for better compatibility */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save Field Card'}
            </Text>
          </TouchableOpacity>
          
          {/* Direct PDF Export Button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleDirectPDF}
          >
            <Feather name="file-text" size={18} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.secondaryButtonText}>Generate PDF Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tertiaryButtonText}>Back to Input</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Floating Capture Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => handleDirectPDF()}
        >
          <Feather name="file-text" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    color: COLORS.white,
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  professionalDesignBanner: {
    backgroundColor: COLORS.warning + '20', // 20% opacity
    borderWidth: 1,
    borderColor: COLORS.warning,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  professionalDesignText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: SPACING.xs,
  },
  professionalDesignSubtext: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  infoLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  infoValue: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  resultItem: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  resultLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  resultValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resultValueLarge: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resultSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  // Visualization styles
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    marginVertical: SPACING.md,
    position: 'relative',
  },
  circlesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    position: 'relative',
  },
  circleSize: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSizeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    padding: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 4,
  },
  nonStandardSizeIndicator: {
    position: 'absolute',
    bottom: -30,
    alignSelf: 'center',
  },
  nonStandardSizeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sizeLegend: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
  },
  legendTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  sizeLegendItem: {
    marginHorizontal: 4,
    marginVertical: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: SCREEN.borderRadius,
    backgroundColor: COLORS.background + '60',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedSizeLegendItem: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  sizeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
  },
  selectedSizeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  nonStandardSizeLegend: {
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  nonStandardSizeLegendText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  // Engineering note
  engineeringNote: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '15', // 15% opacity
    padding: SPACING.sm,
    borderRadius: SCREEN.borderRadius,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  warningIcon: {
    marginRight: SPACING.sm,
  },
  engineeringNoteText: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
  // Bridge visualization
  bridgeRecommendation: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  xContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xLine1: {
    width: 120,
    height: 4,
    backgroundColor: COLORS.warning,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  xLine2: {
    width: 120,
    height: 4,
    backgroundColor: COLORS.warning,
    transform: [{ rotate: '-45deg' }],
    position: 'absolute',
  },
  bridgeIcon: {
    position: 'absolute',
    width: 140,
    height: 60,
  },
  bridgeDeck: {
    position: 'absolute',
    top: 0,
    width: 140,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  bridgePillarLeft: {
    position: 'absolute',
    top: 12,
    left: 20,
    width: 10,
    height: 48,
    backgroundColor: COLORS.primary,
  },
  bridgePillarRight: {
    position: 'absolute',
    top: 12,
    right: 20,
    width: 10,
    height: 48,
    backgroundColor: COLORS.primary,
  },
  bridgeRecommendationText: {
    position: 'absolute',
    bottom: 40,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.warning,
    textAlign: 'center',
  },
  bridgeRecommendationSize: {
    position: 'absolute',
    bottom: 20,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Comment styles
  commentSaveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  commentSaveText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  // Button styles
  buttonContainer: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  button: {
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  tertiaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  // Floating button
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  captureButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Error container
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZE.md,
  },
});

export default ResultScreen;