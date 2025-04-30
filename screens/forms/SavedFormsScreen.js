import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING } from '../../constants/constants';

/**
 * Internal PDF generator - inline implementation to avoid import resolution issues
 * This eliminates the need for an external PDFGenerator import
 */
const generateReport = async (
  fieldCard,
  recommendedSize,
  culvertArea,
  flowCapacity,
  calculationMethod,
  requiresProfessionalDesign,
  photos = []
) => {
  try {
    // Create a timestamp for the filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `culvert-assessment-${timestamp}.txt`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Create a text representation of the report content
    let content = `# Culvert Assessment Field Report\n\n`;
    content += `Date: ${new Date().toLocaleString()}\n\n`;
    
    // Stream identification
    if (fieldCard.streamId) {
      content += `## Stream Identification\n`;
      content += `Stream ID: ${fieldCard.streamId || 'Unnamed Assessment'}\n\n`;
    }
    
    // GPS coordinates
    if (fieldCard.gpsCoordinates) {
      content += `## Location\n`;
      const { latitude, longitude, accuracy } = fieldCard.gpsCoordinates;
      content += `Latitude: ${latitude ? latitude.toFixed(6) : 'N/A'}\n`;
      content += `Longitude: ${longitude ? longitude.toFixed(6) : 'N/A'}\n`;
      if (accuracy) {
        content += `Accuracy: ±${accuracy.toFixed(1)}m\n`;
      }
      content += '\n';
    }
    
    // Calculation method
    content += `## Calculation Method\n`;
    content += `Method: ${calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}\n\n`;
    
    // Results
    content += `## Results\n`;
    content += `Recommended Culvert Size: ${recommendedSize} mm\n`;
    content += `Culvert Area: ${culvertArea ? culvertArea.toFixed(2) : 'N/A'} m²\n`;
    content += `Flow Capacity: ${flowCapacity ? flowCapacity.toFixed(2) : 'N/A'} m³/s\n`;
    
    if (requiresProfessionalDesign) {
      content += `\n⚠️ PROFESSIONAL ENGINEERING DESIGN REQUIRED ⚠️\n`;
      content += `The recommended culvert size exceeds standard installation parameters. Professional engineering design is required for this installation.\n\n`;
    }
    
    // Comments/Notes
    if (fieldCard.comments) {
      content += `## Field Notes\n`;
      content += `${fieldCard.comments}\n\n`;
    }
    
    // Photos
    if (photos && photos.length > 0) {
      content += `## Photos (${photos.length})\n`;
      photos.forEach((photo, index) => {
        content += `Photo ${index + 1}: ${photo.timestamp || 'No timestamp'}\n`;
        if (photo.comment) {
          content += `Comment: ${photo.comment}\n`;
        }
        content += '\n';
      });
    }
    
    // Save the file
    await FileSystem.writeAsStringAsync(fileUri, content);
    
    // Share the report
    await Share.share({
      title: 'Culvert Assessment Report',
      url: `file://${fileUri}`,
      message: 'Culvert Assessment Report'
    });
    
    return fileUri;
  } catch (error) {
    console.error('Error generating report:', error);
    Alert.alert('Error', `Failed to generate report: ${error.message}`);
    throw error;
  }
};

/**
 * SavedFormsScreen Component
 * Displays a list of saved field forms and assessments
 */
const SavedFormsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSavedAssessments();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSavedAssessments();
    });

    return unsubscribe;
  }, [navigation]);

  const loadSavedAssessments = async () => {
    try {
      setLoading(true);
      
      // Load culvert assessments
      const culvertAssessments = await AsyncStorage.getItem('@culvert_assessments');
      const parsedCulvertAssessments = culvertAssessments ? JSON.parse(culvertAssessments) : [];
      
      // TODO: Load other form types in the future
      
      // Combine all assessments and sort by timestamp (newest first)
      const allAssessments = [...parsedCulvertAssessments];
      allAssessments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setAssessments(allAssessments);
    } catch (error) {
      console.error('Error loading saved assessments:', error);
      Alert.alert('Error', 'Failed to load saved assessments');
    } finally {
      setLoading(false);
    }
  };

  const deleteAssessment = async (id) => {
    try {
      // Confirm deletion
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this assessment? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setProcessing(true);
              
              // Get current assessments
              const culvertAssessments = await AsyncStorage.getItem('@culvert_assessments');
              const parsedCulvertAssessments = culvertAssessments ? JSON.parse(culvertAssessments) : [];
              
              // Filter out the assessment to delete
              const updatedAssessments = parsedCulvertAssessments.filter(item => item.id !== id);
              
              // Save updated assessments
              await AsyncStorage.setItem('@culvert_assessments', JSON.stringify(updatedAssessments));
              
              // Refresh the list
              loadSavedAssessments();
              
              setProcessing(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting assessment:', error);
      Alert.alert('Error', 'Failed to delete assessment');
      setProcessing(false);
    }
  };

  const handleGeneratePDF = async (assessment) => {
    try {
      setProcessing(true);
      
      // Create field card with assessment data
      const fieldCard = {
        streamId: assessment.streamId || `Assessment-${assessment.id}`,
        gpsCoordinates: assessment.gpsCoordinates,
        comments: assessment.comments,
      };
      
      // Add method-specific data
      if (assessment.calculationMethod === 'california' && assessment.californiaMethod) {
        Object.assign(fieldCard, {
          averageTopWidth: parseFloat(assessment.californiaMethod.topWidth),
          depth: parseFloat(assessment.californiaMethod.depth),
          bottomWidth: assessment.californiaMethod.bottomWidth 
            ? parseFloat(assessment.californiaMethod.bottomWidth) 
            : parseFloat(assessment.californiaMethod.topWidth) * 0.5,
          crossSectionalArea: assessment.culvertArea / 3, // Reverse calculate the original area
          climateFactorEnabled: assessment.californiaMethod.climateFactorEnabled,
          climateFactor: assessment.californiaMethod.climateFactorEnabled 
            ? parseFloat(assessment.californiaMethod.climateFactor) 
            : null,
        });
      } else if (assessment.calculationMethod === 'area-based' && assessment.areaBasedMethod) {
        Object.assign(fieldCard, {
          watershedArea: parseFloat(assessment.areaBasedMethod.watershedArea),
          precipitation: parseFloat(assessment.areaBasedMethod.precipitation),
          runoffCoefficient: parseFloat(assessment.areaBasedMethod.runoffCoefficient),
          climateFactorEnabled: assessment.areaBasedMethod.climateFactorEnabled,
          climateFactor: assessment.areaBasedMethod.climateFactorEnabled 
            ? parseFloat(assessment.areaBasedMethod.climateFactor) 
            : null,
        });
      }
      
      // Add transport assessment data if available
      if (assessment.transportAssessment) {
        Object.assign(fieldCard, {
          transportAssessment: assessment.transportAssessment,
        });
      }
      
      // Generate and share PDF report with our inline function
      await generateReport(
        fieldCard,
        assessment.recommendedSize,
        assessment.culvertArea,
        assessment.flowCapacity,
        assessment.calculationMethod,
        assessment.requiresProfessionalDesign,
        assessment.photos || []
      );
      
      Alert.alert('Success', 'Report generated and ready to share');
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setProcessing(false);
    }
  };

  const renderAssessmentItem = ({ item }) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    const time = new Date(item.timestamp).toLocaleTimeString();
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.streamId || `Assessment-${item.id}`}</Text>
          <Text style={styles.cardDate}>{date} {time}</Text>
        </View>
        
        <View style={styles.cardContent}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Calculation Method:</Text>
            <Text style={styles.dataValue}>
              {item.calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}
            </Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Recommended Size:</Text>
            <Text style={styles.dataValue}>{item.recommendedSize} mm</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Photos:</Text>
            <Text style={styles.dataValue}>{item.photos ? item.photos.length : 0}</Text>
          </View>
        </View>
        
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleGeneratePDF(item)}
          >
            <Feather name="file-text" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Generate Report</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => deleteAssessment(item.id)}
          >
            <Feather name="trash-2" size={20} color="#e53935" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved assessments...</Text>
      </View>
    );
  }

  // Show message if no assessments are found
  if (assessments.length === 0) {
    return (
      <View style={styles.centered}>
        <Feather name="clipboard" size={60} color="#ccc" />
        <Text style={styles.emptyText}>No saved assessments found</Text>
        <Text style={styles.emptySubtext}>
          Complete an assessment using the Culvert Calculator to save it here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.processingText}>Processing...</Text>
        </View>
      )}
      
      <FlatList
        data={assessments}
        renderItem={renderAssessmentItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContainer: {
    padding: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardHeader: {
    padding: SPACING.md,
    backgroundColor: COLORS.cardIconBg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  cardDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  cardContent: {
    padding: SPACING.md,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  dataValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  actionButtonText: {
    marginLeft: SPACING.xs,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  deleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  deleteButtonText: {
    color: '#e53935',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  processingText: {
    marginTop: SPACING.md,
    color: '#fff',
    fontSize: 16,
  },
});

export default SavedFormsScreen;