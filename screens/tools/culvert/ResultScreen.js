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
import pdfGenerator from '../../../utils/pdf/pdfGenerator';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';

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
  const [images, setImages] = useState([]);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  
  const { width } = useWindowDimensions();
  
  // Check if we have transport and climate data
  const hasTransportData = fieldCard.transportAssessmentUsed || false;
  const hasClimateData = fieldCard.climateProjectionUsed || false;
  
  // Standard culvert sizes for visualization
  const standardSizes = [600, 800, 1000, 1200, 1500, 1800, 2000];
  
  // Flag for showing bridge recommendation
  const showBridgeRecommendation = culvertDiameter > 2000;

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
          setImages(latestData.imageUris || []);
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
  
  // Take a photo with camera
  const handleTakePhoto = async () => {
    try {
      const image = await imageManager.takePhoto();
      
      if (image) {
        await addImageAndRefresh(image);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };
  
  // Select image from gallery
  const handleSelectImage = async () => {
    try {
      const image = await imageManager.selectImage();
      
      if (image) {
        await addImageAndRefresh(image);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  // Add image to field card and refresh data
  const addImageAndRefresh = async (image) => {
    if (!fieldCard.id) {
      await handleSave(); // Save the field card first to get an ID
    }
    
    try {
      setIsLoading(true);
      
      // Save image to storage
      const savedImageUri = await imageManager.saveImageToStorage(image, fieldCard.id);
      
      // Add image to field card
      await addImageToFieldCard(fieldCard.id, savedImageUri);
      
      // Refresh data
      await loadFieldCardData();
      
      Alert.alert('Success', 'Image added successfully.');
    } catch (error) {
      console.error('Error adding image:', error);
      Alert.alert('Error', 'Failed to add image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle image press (open modal)
  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };
  
  // Delete image
  const handleDeleteImage = async (imageUri) => {
    try {
      setIsLoading(true);
      
      // Remove image from field card
      await removeImageFromFieldCard(fieldCard.id, imageUri);
      
      // Refresh data
      await loadFieldCardData();
      
      // Close modal if open
      if (selectedImage === imageUri) {
        setImageModalVisible(false);
        setSelectedImage(null);
      }
      
      Alert.alert('Success', 'Image deleted successfully.');
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Failed to delete image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
  
  // Generate PDF report
  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true);
      
      // Save any unsaved comments first
      if (fieldCard.comments !== comments) {
        await addComment(fieldCard.id, comments);
      }
      
      // Generate PDF
      const pdfUri = await pdfGenerator.generatePDF(fieldCard, {
        comments,
        images
      });
      
      // Show options for PDF
      Alert.alert(
        'PDF Created',
        'What would you like to do with the PDF?',
        [
          {
            text: 'Share',
            onPress: () => pdfGenerator.sharePDF(pdfUri)
          },
          {
            text: 'Save to Device',
            onPress: () => pdfGenerator.savePDFToDevice(pdfUri)
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
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
  
  // Handle sharing results
  const handleShare = async () => {
    try {
      // Create different content based on calculation method
      let measurementsText = '';
      
      if (calculationMethod === 'california') {
        // Format the measurements for California Method
        const avgTopWidth = fieldCard.averageTopWidth?.toFixed(2) || 'N/A';
        const avgDepth = fieldCard.averageDepth?.toFixed(2) || 'N/A';
        
        measurementsText = `\nSTREAM MEASUREMENTS:\n- Average Top Width: ${avgTopWidth} m\n- Bottom Width: ${fieldCard.bottomWidth} m\n- Average Depth: ${avgDepth} m\n- Cross-sectional Area: ${fieldCard.crossSectionalArea?.toFixed(2) || 'N/A'} m²\n`;
      } else {
        // Format the measurements for Area-based method
        measurementsText = `\nWATERSHED MEASUREMENTS:\n- Watershed Area: ${fieldCard.watershedArea} km²\n- Precipitation: ${fieldCard.precipitation} mm/hr\n`;
      }
      
      // Add transport assessment info if used
      let transportText = '';
      if (hasTransportData) {
        transportText = `\nWATER TRANSPORT POTENTIAL:\n- Bankfull Width Rating: ${fieldCard.debrisRating || 'Low'}\n- Sediment Rating: ${fieldCard.sedimentDepthCategory || 'Low'}\n- Woody Debris Rating: ${fieldCard.logDiameterCategory || 'None'}\n- Transport Index: ${fieldCard.transportIndex?.toFixed(2) || 'N/A'}\n`;

        if (fieldCard.transportRecommendation) {
          transportText += `- ${fieldCard.transportRecommendation}\n`;
          transportText += `- Additional design recommendations provided\n`;
        }
      }
      
      // Add climate projection info if used
      let climateText = '';
      if (hasClimateData) {
        const scenario = fieldCard.climateScenario === '2050s' 
          ? '2050s (+10%)' 
          : fieldCard.climateScenario === '2080s'
            ? '2080s (+20%)'
            : fieldCard.climateScenario === 'custom'
              ? 'Custom'
              : 'None';
              
        climateText = `\nCLIMATE PROJECTION:\n- Scenario: ${scenario}\n- Factor: ${fieldCard.climateProjectionFactor?.toFixed(2) || '1.00'}\n`;
      }
      
      // Create shareable content
      const shareMessage = `\nCulvert Sizing Results\n\nStream/Culvert ID: ${fieldCard.streamId}\nLocation: ${fieldCard.location || 'Not specified'}\nGPS: ${fieldCard.gpsCoordinates ? `${fieldCard.gpsCoordinates.latitude.toFixed(5)}, ${fieldCard.gpsCoordinates.longitude.toFixed(5)}` : 'Not captured'}\n\n${measurementsText}${transportText}${climateText}\n\nRESULTS:\n- Recommended Culvert Size: ${culvertDiameter} mm (${(culvertDiameter/1000).toFixed(2)} m)\n- Cross-sectional Area: ${crossSectionalArea.toFixed(2)} m²\n- Flow Capacity: ${flowCapacity.toFixed(2)} m³/s\n${requiresProfessionalDesign ? '\nNOTE: Professional engineering design is recommended for this installation.' : ''}${showBridgeRecommendation ? '\nBRIDGE RECOMMENDED: Size exceeds standard culvert dimensions.' : ''}\n\n${comments ? `FIELD NOTES:\n${comments}\n\n` : ''}AI Forester Field Companion App\n`;

      const result = await Share.share({
        message: shareMessage,
        title: `Culvert Sizing - ${fieldCard.streamId}`,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to share results. Please try again.');
      console.error('Share error:', error);
    }
  };

  // Render an image item
  const renderImageItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.imageItem} 
      onPress={() => handleImagePress(item)}
    >
      <Image source={{ uri: item }} style={styles.thumbnail} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}
      
      {/* Image preview modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={() => handleDeleteImage(selectedImage)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
          
          {/* Size Adjustments */}
          {(hasTransportData || hasClimateData) && (
            <View style={styles.adjustmentsSection}>
              <Text style={styles.adjustmentsTitle}>Size Adjustments Applied</Text>
              
              {calculationMethod === 'california' && fieldCard.baseSize && (
                <View style={styles.adjustmentItem}>
                  <Text style={styles.adjustmentLabel}>Base Size:</Text>
                  <Text style={styles.adjustmentValue}>{fieldCard.baseSize} mm</Text>
                </View>
              )}
              
              {hasTransportData && fieldCard.transportAdjustedSize && fieldCard.transportAdjustedSize > (fieldCard.baseSize || 0) && (
                <View style={styles.adjustmentItem}>
                  <Text style={styles.adjustmentLabel}>After Transport:</Text>
                  <Text style={styles.adjustmentValue}>
                    {fieldCard.transportAdjustedSize} mm
                    <Text style={styles.adjustmentChange}>
                      {" "}(+{fieldCard.transportAdjustedSize - (fieldCard.baseSize || 0)} mm)
                    </Text>
                  </Text>
                </View>
              )}
              
              {hasClimateData && fieldCard.climateAdjustedSize && fieldCard.climateAdjustedSize > (fieldCard.transportAdjustedSize || fieldCard.baseSize || 0) && (
                <View style={styles.adjustmentItem}>
                  <Text style={styles.adjustmentLabel}>After Climate:</Text>
                  <Text style={styles.adjustmentValue}>
                    {fieldCard.climateAdjustedSize} mm
                    <Text style={styles.adjustmentChange}>
                      {" "}(+{fieldCard.climateAdjustedSize - (fieldCard.transportAdjustedSize || fieldCard.baseSize || 0)} mm)
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Transport Assessment Results */}
          {hasTransportData && fieldCard.transportIndex > 0 && (
            <View style={styles.assessmentSection}>
              <Text style={styles.assessmentTitle}>Water Transport Potential Assessment</Text>
              
              <View style={styles.assessmentItem}>
                <Text style={styles.assessmentLabel}>Transport Index:</Text>
                <Text style={styles.assessmentValue}>{fieldCard.transportIndex.toFixed(1)}</Text>
              </View>
              
              <View style={styles.wtpCategoriesContainer}>
                <View style={styles.wtpCategoryItem}>
                  <Text style={styles.wtpCategoryLabel}>Bankfull Width:</Text>
                  <Text style={styles.wtpCategoryValue}>{fieldCard.debrisRating || 'Low'}</Text>
                </View>
                
                <View style={styles.wtpCategoryItem}>
                  <Text style={styles.wtpCategoryLabel}>Sediment:</Text>
                  <Text style={styles.wtpCategoryValue}>{fieldCard.sedimentDepthCategory || 'Low'}</Text>
                </View>
                
                <View style={styles.wtpCategoryItem}>
                  <Text style={styles.wtpCategoryLabel}>Woody Debris:</Text>
                  <Text style={styles.wtpCategoryValue}>{fieldCard.logDiameterCategory || 'None'}</Text>
                </View>
              </View>
              
              {fieldCard.transportRecommendation && (
                <Text style={styles.transportRecommendation}>
                  {fieldCard.transportRecommendation}
                </Text>
              )}
              
              <View style={styles.warningSectionContainer}>
                <Text style={styles.warningTitle}>Important Note on Water Transport Potential:</Text>
                <View style={styles.warningItem}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}>WTP assessments <Text style={styles.warningBold}>are not simple averages</Text>.</Text>
                </View>
                <View style={styles.warningItem}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}><Text style={styles.warningBold}>One critical risk</Text> (like an active landslide source) <Text style={styles.warningBold}>dominates</Text> the overall sediment delivery risk.</Text>
                </View>
                <View style={styles.warningItem}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}>Even if other aspects seem stable, <Text style={styles.warningBold}>a single high-instability feature</Text> can mobilize major sediment.</Text>
                </View>
                <View style={styles.warningItem}>
                  <Text style={styles.warningBullet}>•</Text>
                  <Text style={styles.warningText}><Text style={styles.warningBold}>Err on the side of the highest rating</Text> when making your final call.</Text>
                </View>
              </View>
              
              {fieldCard.transportTips && fieldCard.transportTips.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Design Recommendations:</Text>
                  {fieldCard.transportTips.map((tip, index) => (
                    <View key={index} style={styles.tipItem}>
                      <Text style={styles.tipBullet}>•</Text>
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          
          {/* Climate Projection Results */}
          {hasClimateData && fieldCard.climateProjectionFactor > 1.0 && (
            <View style={styles.climateSection}>
              <Text style={styles.climateTitle}>Climate Change Projection</Text>
              
              <View style={styles.climateItem}>
                <Text style={styles.climateLabel}>Scenario:</Text>
                <Text style={styles.climateValue}>
                  {fieldCard.climateScenario === '2050s' ? '2050s (+10%)' : 
                  fieldCard.climateScenario === '2080s' ? '2080s (+20%)' : 
                  fieldCard.climateScenario === 'custom' ? 'Custom' : 'None'}
                </Text>
              </View>
              
              <View style={styles.climateItem}>
                <Text style={styles.climateLabel}>Uplift Factor:</Text>
                <Text style={styles.climateValue}>
                  {fieldCard.climateProjectionFactor.toFixed(2)}
                  <Text style={styles.climateChange}>
                    {" "}(+{((fieldCard.climateProjectionFactor - 1) * 100).toFixed(0)}%)
                  </Text>
                </Text>
              </View>
              
              <Text style={styles.climateNote}>
                Climate change projections applied to increase culvert capacity for future precipitation changes.
              </Text>
            </View>
          )}
          
          {calculationMethod === 'california' && (
            <View style={styles.methodResults}>
              <Text style={styles.methodTitle}>California Method Results</Text>
              
              {fieldCard.tableBasedSize && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Table-Based Size:</Text>
                  <Text style={styles.infoValue}>{fieldCard.tableBasedSize} mm</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Area-Based Size:</Text>
                <Text style={styles.infoValue}>{fieldCard.areaBasedSize} mm</Text>
              </View>
              
              <Text style={styles.methodDescription}>
                Final size is the larger of the two methods, rounded to standard culvert sizes.
              </Text>
            </View>
          )}
          
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>{culvertDescription}</Text>
            <Text style={styles.infoBoxText}>
              This culvert size is appropriate for the watershed characteristics and stream measurements provided.
              Always consult local regulations and engineering standards before installation.
            </Text>
          </View>
        </View>
        
        {/* Visualization */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Culvert Size Visualization</Text>
          
          {/* Culvert Visualization */}
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
              /* Concentric circles visualization for standard sizes */
              <View style={styles.circlesContainer}>
                {standardSizes.map((size, index) => {
                  const isSelectedSize = size === culvertDiameter;
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
                          borderColor: isSelectedSize ? COLORS.primary : COLORS.border,
                          borderWidth: isSelectedSize ? 3 : 1,
                          backgroundColor: isSelectedSize ? `${COLORS.primary}20` : 'transparent',
                          position: 'absolute',
                          zIndex: standardSizes.length - index,
                        }
                      ]}
                    >
                      {isSelectedSize && (
                        <Text style={styles.selectedSizeText}>{size}mm</Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Sizes Legend */}
          <View style={styles.sizeLegend}>
            <Text style={styles.legendTitle}>Standard Culvert Sizes (mm):</Text>
            <View style={styles.sizesRow}>
              {standardSizes.map(size => (
                <View 
                  key={`legend-${size}`} 
                  style={[
                    styles.sizeLegendItem,
                    size === culvertDiameter ? styles.selectedSizeLegendItem : null
                  ]}
                >
                  <Text 
                    style={[
                      styles.sizeText,
                      size === culvertDiameter ? styles.selectedSizeText : null
                    ]}
                  >
                    {size}
                  </Text>
                </View>
              ))}
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
        </View>
        
        {/* Field Notes Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Field Notes</Text>
          <TextInput
            style={styles.commentsInput}
            multiline
            numberOfLines={6}
            placeholder="Enter field notes, observations, or additional information here..."
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
        
        {/* Site Photos */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Site Photos</Text>
          <View style={styles.photoButtonsContainer}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleTakePhoto}
            >
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={handleSelectImage}
            >
              <Text style={styles.photoButtonText}>Select from Gallery</Text>
            </TouchableOpacity>
          </View>
          
          {images.length > 0 ? (
            <FlatList
              data={images}
              renderItem={renderImageItem}
              keyExtractor={(item, index) => `image-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesContainer}
            />
          ) : (
            <View style={styles.noImagesContainer}>
              <Text style={styles.noImagesText}>No photos added yet.</Text>
            </View>
          )}
        </View>
        
        {/* Input Parameters Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Input Parameters</Text>
          
          {calculationMethod === 'california' ? (
            // California Method parameters
            <>
              <Text style={styles.parameterTitle}>Stream Measurements</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Avg. Top Width:</Text>
                <Text style={styles.infoValue}>{fieldCard.averageTopWidth.toFixed(2)} m</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bottom Width:</Text>
                <Text style={styles.infoValue}>{fieldCard.bottomWidth} m</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Avg. Depth:</Text>
                <Text style={styles.infoValue}>{fieldCard.averageDepth.toFixed(2)} m</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Cross Section:</Text>
                <Text style={styles.infoValue}>{fieldCard.crossSectionalArea.toFixed(2)} m²</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End Opening:</Text>
                <Text style={styles.infoValue}>{fieldCard.endOpeningArea.toFixed(2)} m²</Text>
              </View>
            </>
          ) : (
            // Area-based parameters
            <>
              <Text style={styles.parameterTitle}>Watershed Parameters</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Watershed Area:</Text>
                <Text style={styles.infoValue}>{fieldCard.watershedArea} km²</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Precipitation:</Text>
                <Text style={styles.infoValue}>{fieldCard.precipitation} mm/hr</Text>
              </View>
            </>
          )}
          
          {/* Transport parameters */}
          {hasTransportData && (
            <>
              <Text style={[styles.parameterTitle, styles.sectionSpacer]}>Water Transport Potential</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bankfull Width:</Text>
                <Text style={styles.infoValue}>{fieldCard.debrisRating}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sediment:</Text>
                <Text style={styles.infoValue}>{fieldCard.sedimentDepthCategory}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Woody Debris:</Text>
                <Text style={styles.infoValue}>{fieldCard.logDiameterCategory}</Text>
              </View>
            </>
          )}
          
          {/* Climate parameters */}
          {hasClimateData && fieldCard.climateProjectionFactor > 1.0 && (
            <>
              <Text style={[styles.parameterTitle, styles.sectionSpacer]}>Climate Parameters</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Scenario:</Text>
                <Text style={styles.infoValue}>
                  {fieldCard.climateScenario === '2050s' ? '2050s' : 
                   fieldCard.climateScenario === '2080s' ? '2080s' : 
                   fieldCard.climateScenario === 'custom' ? 'Custom' : 'None'}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Uplift Factor:</Text>
                <Text style={styles.infoValue}>{fieldCard.climateProjectionFactor.toFixed(2)}</Text>
              </View>
            </>
          )}
        </View>
        
        {/* Action Buttons */}
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
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGeneratePDF}
          >
            <Text style={styles.secondaryButtonText}>Generate PDF Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleShare}
          >
            <Text style={styles.secondaryButtonText}>Share Results</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.tertiaryButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tertiaryButtonText}>Back to Input</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  adjustmentsSection: {
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  adjustmentsTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  adjustmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  adjustmentLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  adjustmentValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  adjustmentChange: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.accent,
  },
  assessmentSection: {
    backgroundColor: COLORS.accent + '10', // 10% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  assessmentTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: SPACING.md,
  },
  assessmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  assessmentLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  assessmentValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  wtpCategoriesContainer: {
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  wtpCategoryItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  wtpCategoryLabel: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  wtpCategoryValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.accent,
  },
  transportRecommendation: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.accent,
    marginBottom: SPACING.sm,
  },
  warningSectionContainer: {
    backgroundColor: COLORS.warning + '15', // 15% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  warningTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  warningBullet: {
    fontSize: FONT_SIZE.md,
    color: COLORS.warning,
    marginRight: SPACING.xs,
    width: 15,
  },
  warningText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    flex: 1,
  },
  warningBold: {
    fontWeight: 'bold',
  },
  tipsContainer: {
    marginTop: SPACING.sm,
  },
  tipsTitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  tipItem: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
  },
  tipBullet: {
    fontSize: FONT_SIZE.md,
    color: COLORS.accent,
    marginRight: SPACING.xs,
    width: 15,
  },
  tipText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    flex: 1,
  },
  climateSection: {
    backgroundColor: COLORS.info + '10', // 10% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  climateTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.info,
    marginBottom: SPACING.sm,
  },
  climateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  climateLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  climateValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  climateChange: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.info,
  },
  climateNote: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  methodResults: {
    backgroundColor: COLORS.primary + '10', // 10% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  methodTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  methodDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: SPACING.sm,
  },
  parameterTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
  },
  sectionSpacer: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  infoBox: {
    backgroundColor: COLORS.primaryLight + '20', // 20% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoBoxTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  infoBoxText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
    lineHeight: FONT_SIZE.md * 1.3,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    minHeight: 250,
  },
  circlesContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
  },
  circleSize: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedSizeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: FONT_SIZE.md,
  },
  bridgeRecommendation: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },
  xContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  xLine1: {
    position: 'absolute',
    width: 80,
    height: 10,
    backgroundColor: COLORS.error,
    transform: [{ rotate: '45deg' }],
    borderRadius: 5,
  },
  xLine2: {
    position: 'absolute',
    width: 80,
    height: 10,
    backgroundColor: COLORS.error,
    transform: [{ rotate: '-45deg' }],
    borderRadius: 5,
  },
  bridgeIcon: {
    width: 180,
    height: 80,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  bridgeDeck: {
    width: 180,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    marginBottom: 5,
  },
  bridgePillarLeft: {
    position: 'absolute',
    left: 30,
    top: 25,
    width: 12,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  bridgePillarRight: {
    position: 'absolute',
    right: 30,
    top: 25,
    width: 12,
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  bridgeRecommendationText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  bridgeRecommendationSize: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  sizeLegend: {
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  legendTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  sizesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  sizeLegendItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SCREEN.borderRadius,
  },
  selectedSizeLegendItem: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  sizeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  selectedSizeText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    fontSize: FONT_SIZE.md,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  commentSaveButton: {
    backgroundColor: COLORS.primaryLight,
    padding: SPACING.sm,
    borderRadius: SCREEN.borderRadius,
    alignItems: 'center',
  },
  commentSaveText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: SCREEN.borderRadius,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
  },
  photoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  imagesContainer: {
    marginVertical: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  noImagesContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
    marginVertical: SPACING.sm,
  },
  noImagesText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  imageItem: {
    marginRight: SPACING.sm,
    borderRadius: SCREEN.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  thumbnail: {
    width: 120,
    height: 120,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    width: '90%',
    maxHeight: '80%',
    padding: SPACING.md,
  },
  fullImage: {
    width: '100%',
    height: 300,
    marginBottom: SPACING.md,
    borderRadius: SCREEN.borderRadius,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.sm,
    borderRadius: SCREEN.borderRadius,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: SPACING.sm,
    fontSize: FONT_SIZE.md,
  },
  buttonContainer: {
    marginTop: SPACING.md,
  },
  button: {
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: COLORS.accent,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tertiaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZE.lg,
    color: COLORS.error,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
});

export default ResultScreen;
