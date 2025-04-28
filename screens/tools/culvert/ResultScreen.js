import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Share,
  useWindowDimensions
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
  const { fieldCard, culvertDiameter } = route.params || {};
  const [isSaving, setIsSaving] = useState(false);
  const { width } = useWindowDimensions();
  
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

  // Calculate additional values
  const crossSectionalArea = calculateCrossSectionalArea(culvertDiameter);
  const flowCapacity = calculateFlowCapacity(
    culvertDiameter,
    parseFloat(fieldCard.channelSlope) / 100 // Convert from percentage to decimal
  );
  const sizingAssessment = assessCulvertSizing(
    culvertDiameter,
    culvertDiameter // Using same value as we calculated it (for actual assessment, compare to existing)
  );
  const culvertDescription = getCulvertSizeDescription(culvertDiameter);
  
  // Prepare culvert visualization dimensions
  const culvertSizeInMeters = culvertDiameter / 1000; // Convert mm to m
  const personHeight = 1.8; // Average person height in meters
  const scaleFactor = width * 0.6 / (culvertSizeInMeters > personHeight ? culvertSizeInMeters : personHeight * 1.2);
  
  const culvertRadius = (culvertSizeInMeters / 2) * scaleFactor;
  const personHeightScaled = personHeight * scaleFactor;
  
  // Handle saving field card
  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Add calculated results to field card
      const cardToSave = {
        ...fieldCard,
        crossSectionalArea,
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
      // Create shareable content
      const shareMessage = `
Culvert Sizing Results

Project: ${fieldCard.projectName}
Location: ${fieldCard.location || 'Not specified'}
GPS: ${fieldCard.gpsCoordinates ? `${fieldCard.gpsCoordinates.latitude.toFixed(5)}, ${fieldCard.gpsCoordinates.longitude.toFixed(5)}` : 'Not captured'}

MEASUREMENTS:
- Watershed Area: ${fieldCard.watershedArea} km²
- Channel Slope: ${fieldCard.channelSlope}%
- Stream Width: ${fieldCard.streamWidth} m
- Stream Depth: ${fieldCard.streamDepth} m
- Precipitation: ${fieldCard.precipitation} mm/hr
${fieldCard.climateProjectionUsed ? `- Climate Projection Factor: ${fieldCard.climateProjectionFactor}` : ''}

RESULTS:
- Recommended Culvert Size: ${culvertDiameter} mm (${(culvertDiameter/1000).toFixed(2)} m)
- Cross-sectional Area: ${crossSectionalArea.toFixed(2)} m²
- Flow Capacity: ${flowCapacity.toFixed(2)} m³/s

AI Forester Field Companion App
`;

      const result = await Share.share({
        message: shareMessage,
        title: `Culvert Sizing - ${fieldCard.projectName}`,
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
        
        {/* Project Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Project Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Project Name:</Text>
            <Text style={styles.infoValue}>{fieldCard.projectName}</Text>
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
          
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>{culvertDescription}</Text>
            <Text style={styles.infoBoxText}>
              This culvert size is appropriate for the watershed characteristics and precipitation rates provided.
              Always consult local regulations and engineering standards before installation.
            </Text>
          </View>
        </View>
        
        {/* Visualization */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Culvert Visualization</Text>
          
          <View style={styles.visualizationContainer}>
            {/* Culvert Circle */}
            <View style={[
              styles.culvertCircle,
              {
                width: culvertRadius * 2,
                height: culvertRadius * 2,
                borderRadius: culvertRadius,
              }
            ]}>
              <Text style={styles.culvertSizeText}>{culvertDiameter} mm</Text>
            </View>
            
            {/* Person Silhouette (simplified) */}
            <View style={[
              styles.personContainer,
              {
                height: personHeightScaled,
              }
            ]}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
              <View style={styles.personLegs} />
            </View>
          </View>
          
          <Text style={styles.visualizationCaption}>
            Culvert size shown to scale with average human height (1.8m)
          </Text>
        </View>
        
        {/* Input Parameters Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Input Parameters</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Watershed Area:</Text>
            <Text style={styles.infoValue}>{fieldCard.watershedArea} km²</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Channel Slope:</Text>
            <Text style={styles.infoValue}>{fieldCard.channelSlope}%</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stream Width:</Text>
            <Text style={styles.infoValue}>{fieldCard.streamWidth} m</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Stream Depth:</Text>
            <Text style={styles.infoValue}>{fieldCard.streamDepth} m</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Precipitation:</Text>
            <Text style={styles.infoValue}>{fieldCard.precipitation} mm/hr</Text>
          </View>
          
          {fieldCard.climateProjectionUsed && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Climate Factor:</Text>
              <Text style={styles.infoValue}>{fieldCard.climateProjectionFactor}</Text>
            </View>
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
  },
  culvertCircle: {
    backgroundColor: COLORS.primaryLight + '40', // 40% opacity
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.lg,
  },
  culvertSizeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  personContainer: {
    width: 20,
    alignItems: 'center',
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
