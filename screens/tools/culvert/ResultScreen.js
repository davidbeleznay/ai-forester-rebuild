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
import PDFGenerator from '../../../utils/PDFGenerator';
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
  
  // Generate a PDF report using the dedicated PDFGenerator
  const handleGeneratePDF = async () => {
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
                  handleGeneratePDF();
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setIsLoading(false);
        return;
      }
      
      // Get current version of field card with all data
      const currentFieldCard = await getFieldCardById(fieldCard.id);
      
      // Prepare images for PDF
      const images = currentFieldCard.images || [];
      
      // Generate and share PDF using the utility
      const result = await PDFGenerator.generateAndSharePDF(
        currentFieldCard,
        culvertDiameter,
        crossSectionalArea,
        flowCapacity,
        calculationMethod,
        requiresProfessionalDesign,
        images
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setIsLoading(false);
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
          
          {/* PDF Export Button */}
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGeneratePDF}
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
      
      {/* Floating PDF Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={() => handleGeneratePDF()}
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