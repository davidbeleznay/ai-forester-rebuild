import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, CULVERT_SIZES } from '../../../constants/constants';
import { useNetwork } from '../../../utils/NetworkContext';
import PDFGenerator from '../../../utils/PDFGenerator';

/**
 * Culvert Results Screen
 * Displays the calculated culvert sizing results and recommendations
 */
const CulvertResultsScreen = ({ route, navigation }) => {
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [culvertDiameter, setCulvertDiameter] = useState(0);
  const [recommendedSize, setRecommendedSize] = useState('');
  const [requiresProfessionalDesign, setRequiresProfessionalDesign] = useState(false);
  const { isConnected } = useNetwork();

  // Get parameters from navigation route
  const { 
    fieldCard, 
    culvertArea, 
    flowCapacity, 
    calculationMethod,
    assessmentData,
    isTransportAssessment
  } = route.params || {};

  // Calculate the recommended culvert size when component mounts
  useEffect(() => {
    if (isTransportAssessment) {
      // Just display the transport assessment data
      return;
    }

    // Calculate the recommended culvert diameter based on area
    const calculateRecommendedSize = () => {
      // Calculate diameter from area (circular pipe formula: A = πr²)
      // d = 2 * sqrt(A / π) * 1000 (convert to mm)
      const calculatedDiameter = 2 * Math.sqrt(culvertArea / Math.PI) * 1000;
      
      // Find the next largest standard size
      let recommendedSize = 0;
      for (const size of CULVERT_SIZES) {
        if (size >= calculatedDiameter) {
          recommendedSize = size;
          break;
        }
      }
      
      // If no standard size is large enough, use the largest one and flag for professional design
      if (recommendedSize === 0) {
        recommendedSize = CULVERT_SIZES[CULVERT_SIZES.length - 1];
        setRequiresProfessionalDesign(true);
      } else if (recommendedSize >= 2000) {
        // Culverts 2000mm or larger require professional design
        setRequiresProfessionalDesign(true);
      }
      
      setCulvertDiameter(calculatedDiameter);
      setRecommendedSize(recommendedSize);
    };

    calculateRecommendedSize();
  }, [culvertArea, isTransportAssessment]);

  // Save assessment to storage
  const saveAssessment = async () => {
    try {
      setLoading(true);
      
      // Create assessment record
      const assessment = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        fieldCard,
        culvertArea,
        flowCapacity,
        calculationMethod,
        recommendedSize,
        requiresProfessionalDesign,
        isTransportAssessment: false
      };
      
      // Get existing assessments or initialize empty array
      const existingAssessmentsJson = await AsyncStorage.getItem('@culvert_assessments');
      const existingAssessments = existingAssessmentsJson ? JSON.parse(existingAssessmentsJson) : [];
      
      // Add new assessment
      const updatedAssessments = [...existingAssessments, assessment];
      
      // Save to storage
      await AsyncStorage.setItem('@culvert_assessments', JSON.stringify(updatedAssessments));
      
      Alert.alert('Success', 'Assessment saved successfully.');
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate and share PDF report
  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      // Get photos associated with the assessment (if any)
      const storedPhotos = await AsyncStorage.getItem('@temp_images');
      const photos = storedPhotos ? JSON.parse(storedPhotos).filter(photo => photo.isAssociated) : [];
      
      // Generate PDF with assessment data
      const result = await PDFGenerator.generateAndSharePDF(
        fieldCard,
        recommendedSize,
        culvertArea,
        flowCapacity,
        calculationMethod,
        requiresProfessionalDesign,
        photos
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Render transport assessment results
  const renderTransportAssessment = () => {
    if (!assessmentData) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Water Transport Assessment</Text>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Risk Category:</Text>
          <Text 
            style={[
              styles.resultValue, 
              assessmentData.riskCategory === 'High' ? styles.highRisk : 
              assessmentData.riskCategory === 'Medium' ? styles.mediumRisk : 
              styles.lowRisk
            ]}
          >
            {assessmentData.riskCategory}
          </Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Transport Score:</Text>
          <Text style={styles.resultValue}>{assessmentData.score}/9</Text>
        </View>
        
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Additional Sizing:</Text>
          <Text style={styles.resultValue}>{assessmentData.additionalSizing * 100}%</Text>
        </View>
        
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>Recommendations:</Text>
          {assessmentData.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationBullet} />
              <Text style={styles.recommendationText}>{rec}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render culvert sizing results
  const renderCulvertResults = () => {
    if (isTransportAssessment) return null;
    
    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Culvert Size Recommendation</Text>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Recommended Size:</Text>
            <Text style={styles.resultHighlight}>{recommendedSize} mm</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Calculated Diameter:</Text>
            <Text style={styles.resultValue}>{culvertDiameter.toFixed(0)} mm</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Cross-sectional Area:</Text>
            <Text style={styles.resultValue}>{culvertArea.toFixed(2)} m²</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Flow Capacity:</Text>
            <Text style={styles.resultValue}>{flowCapacity.toFixed(2)} m³/s</Text>
          </View>
          
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Calculation Method:</Text>
            <Text style={styles.resultValue}>
              {calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}
            </Text>
          </View>
          
          {requiresProfessionalDesign && (
            <View style={styles.warningContainer}>
              <Feather name="alert-triangle" size={20} color="#FFC107" style={styles.warningIcon} />
              <Text style={styles.warningText}>
                This installation requires professional engineering design.
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Input Parameters</Text>
          
          {calculationMethod === 'california' ? (
            <>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Average Top Width:</Text>
                <Text style={styles.resultValue}>{fieldCard.averageTopWidth.toFixed(2)} m</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Average Depth:</Text>
                <Text style={styles.resultValue}>{fieldCard.averageDepth.toFixed(2)} m</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Bottom Width:</Text>
                <Text style={styles.resultValue}>{fieldCard.bottomWidth} m</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Watershed Area:</Text>
                <Text style={styles.resultValue}>{fieldCard.watershedArea} km²</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Precipitation:</Text>
                <Text style={styles.resultValue}>{fieldCard.precipitation} mm/hr</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Runoff Coefficient:</Text>
                <Text style={styles.resultValue}>{fieldCard.runoffCoefficient}</Text>
              </View>
              
              {fieldCard.climateFactorEnabled && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Climate Factor:</Text>
                  <Text style={styles.resultValue}>{fieldCard.climateFactor}</Text>
                </View>
              )}
            </>
          )}
        </View>
        
        {fieldCard.comments && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Field Notes</Text>
            <Text style={styles.commentText}>{fieldCard.comments}</Text>
          </View>
        )}

        <View style={styles.culvertVisualization}>
          <Text style={styles.visualizationTitle}>Culvert Size Visualization</Text>
          
          <View style={styles.visualizationContainer}>
            {/* Circular representation of culvert size */}
            <View 
              style={[
                styles.culvertCircle,
                { 
                  width: Math.min(300, recommendedSize / 10), 
                  height: Math.min(300, recommendedSize / 10),
                  borderRadius: Math.min(150, recommendedSize / 20)
                }
              ]}
            />
            <Text style={styles.visualizationLabel}>{recommendedSize} mm</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusIndicator,
            isConnected ? styles.onlineIndicator : styles.offlineIndicator
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Online' : 'Offline Mode'}
        </Text>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isTransportAssessment ? 'Transport Assessment' : 'Culvert Results'}
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          {/* Transport Assessment Results */}
          {isTransportAssessment && renderTransportAssessment()}
          
          {/* Culvert Sizing Results */}
          {renderCulvertResults()}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isTransportAssessment && (
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton, loading && styles.disabledButton]}
                onPress={saveAssessment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="save" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Save Assessment</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {!isTransportAssessment && (
              <TouchableOpacity
                style={[styles.actionButton, styles.pdfButton, generatingPDF && styles.disabledButton]}
                onPress={generatePDF}
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="file-text" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Generate PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.actionButton, styles.newButton]}
              onPress={() => navigation.navigate('MethodSelect')}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>New Assessment</Text>
            </TouchableOpacity>
          </View>
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: COLORS.online,
  },
  offlineIndicator: {
    backgroundColor: COLORS.offline,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  section: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  resultLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 15,
    color: COLORS.text,
  },
  resultHighlight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: SPACING.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4037',
  },
  commentText: {
    fontSize: 15,
    color: COLORS.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  culvertVisualization: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  culvertCircle: {
    backgroundColor: COLORS.primary,
    margin: SPACING.md,
  },
  visualizationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  actionButtons: {
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: SPACING.sm,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  pdfButton: {
    backgroundColor: COLORS.secondary,
  },
  newButton: {
    backgroundColor: COLORS.info,
  },
  disabledButton: {
    opacity: 0.6,
  },
  highRisk: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  mediumRisk: {
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  lowRisk: {
    color: COLORS.success,
    fontWeight: 'bold',
  },
  recommendationsContainer: {
    marginTop: SPACING.md,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: SPACING.sm,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default CulvertResultsScreen;