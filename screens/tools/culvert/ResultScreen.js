import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  useWindowDimensions,
  FlatList,
  Switch
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
import { saveFieldCard } from '../../../utils/storage/fieldCardStorage';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';

/**
 * Culvert Tool Result Screen
 * Displays the culvert sizing results with visualization
 */
const ResultScreen = ({ route, navigation }) => {
  // Get data from navigation params
  const { 
    fieldCard, 
    culvertDiameter, 
    requiresProfessionalDesign, 
    calculationMethod,
    transportParams,
    climateScenario
  } = route.params || {};
  
  const [isSaving, setIsSaving] = useState(false);
  const { width } = useWindowDimensions();
  
  // Check if we have transport and climate data
  const hasTransportData = fieldCard.transportAssessmentUsed || false;
  const hasClimateData = fieldCard.climateProjectionUsed || false;
  
  // Add state for toggle switches
  const [showTransportInfo, setShowTransportInfo] = useState(true);
  const [showClimateInfo, setShowClimateInfo] = useState(true);
  
  // Standard culvert sizes for visualization
  const standardSizes = [600, 800, 1000, 1200, 1500, 1800, 2000];
  
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
  
  // Prepare culvert visualization dimensions
  const culvertSizeInMeters = culvertDiameter / 1000; // Convert mm to m
  const personHeight = 1.8; // Average person height in meters
  const scaleFactor = width * 0.6 / (culvertSizeInMeters > personHeight ? culvertSizeInMeters : personHeight * 1.2);
  
  const culvertRadius = (culvertSizeInMeters / 2) * scaleFactor;
  const personHeightScaled = personHeight * scaleFactor;
  
  // Calculate radii for concentric circles
  const getCircleRadius = (size) => {
    return (size / 2000) * scaleFactor;
  };
  
  // Check if size exceeds bridge recommendation
  const shouldShowBridge = culvertDiameter > 2000;
  
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
      };
      
      const cardId = await saveFieldCard(cardToSave);
      
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
        transportText = `\nTRANSPORTABILITY ASSESSMENT:\n- Debris Rating: ${fieldCard.debrisRating || 'Low'}\n- Sediment Depth: ${fieldCard.sedimentDepth || 0} cm\n- Max Log Diameter: ${fieldCard.logDiameter || 0} m\n- Transport Index: ${fieldCard.transportIndex?.toFixed(2) || 'N/A'}\n`;

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
      const shareMessage = `\nCulvert Sizing Results\n\nStream/Culvert ID: ${fieldCard.streamId}\nLocation: ${fieldCard.location || 'Not specified'}\nGPS: ${fieldCard.gpsCoordinates ? `${fieldCard.gpsCoordinates.latitude.toFixed(5)}, ${fieldCard.gpsCoordinates.longitude.toFixed(5)}` : 'Not captured'}\n\n${measurementsText}${transportText}${climateText}\n\nRESULTS:\n- Recommended Culvert Size: ${culvertDiameter} mm (${(culvertDiameter/1000).toFixed(2)} m)\n- Cross-sectional Area: ${crossSectionalArea.toFixed(2)} m²\n- Flow Capacity: ${flowCapacity.toFixed(2)} m³/s\n${requiresProfessionalDesign ? '\nNOTE: Professional engineering design is recommended for this installation.' : ''}\n\nAI Forester Field Companion App\n`;

      const result = await Share.share({
        message: shareMessage,
        title: `Culvert Sizing - ${fieldCard.streamId}`,
      });
      
    } catch (error) {
      Alert.alert('Error', 'Failed to share results. Please try again.');
      console.error('Share error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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
              <View style={styles.sectionHeaderWithToggle}>
                <Text style={styles.assessmentTitle}>Transport & Debris Assessment</Text>
                <Switch
                  trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                  thumbColor={showTransportInfo ? COLORS.primary : '#f4f3f4'}
                  onValueChange={() => setShowTransportInfo(!showTransportInfo)}
                  value={showTransportInfo}
                />
              </View>
              
              {showTransportInfo && (
                <>
                  <View style={styles.assessmentItem}>
                    <Text style={styles.assessmentLabel}>Transport Index:</Text>
                    <Text style={styles.assessmentValue}>{fieldCard.transportIndex.toFixed(1)}</Text>
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
                </>
              )}
            </View>
          )}
          
          {/* Climate Projection Results */}
          {hasClimateData && fieldCard.climateProjectionFactor > 1.0 && (
            <View style={styles.climateSection}>
              <View style={styles.sectionHeaderWithToggle}>
                <Text style={styles.climateTitle}>Climate Change Projection</Text>
                <Switch
                  trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                  thumbColor={showClimateInfo ? COLORS.info : '#f4f3f4'}
                  onValueChange={() => setShowClimateInfo(!showClimateInfo)}
                  value={showClimateInfo}
                />
              </View>
              
              {showClimateInfo && (
                <>
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
                </>
              )}
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
          <Text style={styles.cardTitle}>Culvert Visualization</Text>
          
          <View style={styles.visualizationContainer}>
            {/* Concentric circles for standard culvert sizes */}
            {standardSizes.map((size, index) => (
              size <= 2000 && (
                <View 
                  key={`circle-${size}`} 
                  style={[
                    styles.concentricCircle,
                    {
                      width: getCircleRadius(size) * 2,
                      height: getCircleRadius(size) * 2,
                      borderRadius: getCircleRadius(size),
                      backgroundColor: size === culvertDiameter ? `${COLORS.primary}40` : 'transparent',
                      borderColor: size === culvertDiameter ? COLORS.primary : COLORS.border,
                      borderWidth: size === culvertDiameter ? 2 : 1,
                      zIndex: standardSizes.length - index, // Layer smaller circles on top
                    }
                  ]}
                >
                  {size === culvertDiameter && (
                    <Text style={styles.circleSizeText}>{size} mm</Text>
                  )}
                </View>
              )
            ))}
            
            {/* Bridge recommendation for sizes > 2000mm */}
            {shouldShowBridge && (
              <View style={styles.bridgeIconContainer}>
                <View style={styles.bridgeBeam} />
                <View style={styles.bridgeDeck} />
                <View style={styles.bridgePillar} />
                <View style={styles.bridgePillar} style={[styles.bridgePillar, { right: 10 }]} />
                <Text style={styles.bridgeText}>BRIDGE RECOMMENDED</Text>
                <Text style={styles.bridgeSubtext}>({culvertDiameter} mm culvert)</Text>
              </View>
            )}
            
            {/* Person Silhouette (simplified) */}
            <View style={[
              styles.personContainer,
              { height: personHeightScaled }
            ]}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
              <View style={styles.personLegs} />
            </View>
          </View>
          
          <Text style={styles.visualizationCaption}>
            Culvert size shown to scale with average human height (1.8m)
          </Text>
          
          {/* Size legend */}
          <View style={styles.sizeLegend}>
            <Text style={styles.legendTitle}>Standard Culvert Sizes (mm):</Text>
            <View style={styles.legendItems}>
              {standardSizes.map((size, index) => (
                <View key={`legend-${size}`} style={styles.legendItem}>
                  <View 
                    style={[
                      styles.legendColorBox, 
                      { 
                        backgroundColor: size === culvertDiameter ? `${COLORS.primary}40` : 'transparent',
                        borderColor: size === culvertDiameter ? COLORS.primary : COLORS.border,
                        borderWidth: size === culvertDiameter ? 2 : 1,
                      }
                    ]} 
                  />
                  <Text 
                    style={[
                      styles.legendText, 
                      size === culvertDiameter ? styles.legendTextSelected : {}
                    ]}
                  >
                    {size}
                  </Text>
                </View>
              ))}
              <View style={styles.legendItem}>
                <View style={[styles.legendColorBox, styles.legendBridgeBox]} />
                <Text style={styles.legendText}>2000+</Text>
              </View>
            </View>
          </View>
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
              <Text style={[styles.parameterTitle, styles.sectionSpacer]}>Transport Parameters</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Debris Rating:</Text>
                <Text style={styles.infoValue}>{fieldCard.debrisRating}</Text>
              </View>
              
              {fieldCard.sedimentDepth > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Sediment Depth:</Text>
                  <Text style={styles.infoValue}>{fieldCard.sedimentDepth} cm</Text>
                </View>
              )}
              
              {fieldCard.logDiameter > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Log Diameter:</Text>
                  <Text style={styles.infoValue}>{fieldCard.logDiameter} m</Text>
                </View>
              )}
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
  sectionHeaderWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
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
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginVertical: SPACING.lg,
    position: 'relative',
    minHeight: 160, // Ensure minimum height for visualization
  },
  concentricCircle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: '50%',
    transform: [{ translateX: -50 }], // Center horizontally
  },
  circleSizeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  bridgeIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: '37%', // offset to leave room for person silhouette
    top: 20,
  },
  bridgeBeam: {
    width: 120,
    height: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 2,
    marginBottom: 5,
  },
  bridgeDeck: {
    width: 120,
    height: 15,
    backgroundColor: COLORS.accent + '80',
    borderRadius: 2,
  },
  bridgePillar: {
    position: 'absolute',
    bottom: -30,
    left: 10,
    width: 10,
    height: 30,
    backgroundColor: COLORS.accent,
    borderRadius: 1,
  },
  bridgeText: {
    marginTop: 10,
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.accent,
  },
  bridgeSubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  personContainer: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
    right: -80, // position person to the right of circles
  },
  personHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
  },
  personBody: {
    width: 8,
    height: 30,
    backgroundColor: COLORS.accent,
  },
  personLegs: {
    width: 20,
    height: 30,
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  visualizationCaption: {
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  sizeLegend: {
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: SCREEN.borderRadius,
  },
  legendTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    marginBottom: SPACING.xs,
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 5,
  },
  legendBridgeBox: {
    backgroundColor: COLORS.accent + '40',
    borderColor: COLORS.accent,
    borderWidth: 1,
  },
  legendText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  legendTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
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
