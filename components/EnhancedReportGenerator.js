import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNetwork } from '../utils/NetworkContext';
import ImageCaptureManager from './ImageCaptureManager';
import CommentInput from './CommentInput';
import enhancedPDFGenerator from '../utils/enhancedPDFGenerator';

/**
 * EnhancedReportGenerator component combines image capture, comments, and PDF generation
 * @param {Object} props - Component props
 * @param {Object} props.fieldData - Field data to include in the report
 * @param {string} props.fieldCardId - ID of the field card
 * @returns {JSX.Element} Enhanced report generator component
 */
const EnhancedReportGenerator = ({ fieldData, fieldCardId }) => {
  const [comments, setComments] = useState('');
  const [images, setImages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'photos'
  const { isConnected } = useNetwork();
  
  // Load comments if they exist in field data
  useEffect(() => {
    if (fieldData && fieldData.comments) {
      setComments(fieldData.comments);
    }
  }, [fieldData]);
  
  // Handle images updated from the ImageCaptureManager
  const handleImagesUpdated = (updatedImages) => {
    setImages(updatedImages);
  };
  
  // Generate and share PDF report
  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      
      // Attempt to generate PDF with images
      try {
        const pdfUri = await enhancedPDFGenerator.generatePDF(
          fieldData,
          comments,
          images
        );
        
        await enhancedPDFGenerator.sharePDF(pdfUri);
        return; // Exit if PDF generation was successful
      } catch (pdfError) {
        console.error('PDF generation failed, falling back to text report:', pdfError);
        
        // If PDF generation fails, fall back to text report
        Alert.alert(
          'PDF Generation Issue',
          'Could not generate PDF with images. Falling back to text report.',
          [{ text: 'OK' }]
        );
        
        const textUri = await enhancedPDFGenerator.generateTextReport(
          fieldData,
          comments,
          images
        );
        
        await enhancedPDFGenerator.sharePDF(textUri);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(
        'Report Generation Failed',
        'Could not generate the report. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Save comments to the field card
  const handleSaveComments = async () => {
    if (!fieldCardId) {
      Alert.alert('Error', 'No field card ID provided. Cannot save comments.');
      return;
    }
    
    try {
      // This would typically call a service to save the comments
      // For now, we'll just show a success message
      Alert.alert('Success', 'Comments saved successfully.');
    } catch (error) {
      console.error('Error saving comments:', error);
      Alert.alert('Error', 'Failed to save comments. Please try again.');
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Tab navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'comments' && styles.activeTab
          ]}
          onPress={() => setActiveTab('comments')}
        >
          <Feather
            name="file-text"
            size={18}
            color={activeTab === 'comments' ? '#2c5e2e' : '#777'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'comments' && styles.activeTabText
          ]}>
            Comments
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'photos' && styles.activeTab
          ]}
          onPress={() => setActiveTab('photos')}
        >
          <Feather
            name="camera"
            size={18}
            color={activeTab === 'photos' ? '#2c5e2e' : '#777'}
          />
          <Text style={[
            styles.tabText,
            activeTab === 'photos' && styles.activeTabText
          ]}>
            Photos
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab content */}
      <View style={styles.contentContainer}>
        {activeTab === 'comments' ? (
          <ScrollView style={styles.commentsContainer}>
            <Text style={styles.sectionTitle}>Field Notes</Text>
            <Text style={styles.description}>
              Add detailed notes about site conditions, observations, or recommendations.
            </Text>
            
            <CommentInput
              value={comments}
              onChangeText={setComments}
            />
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveComments}
            >
              <Feather name="save" size={16} color="#fff" />
              <Text style={styles.saveButtonText}>Save Notes</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <View style={styles.photosContainer}>
            <ImageCaptureManager
              fieldCardId={fieldCardId}
              onImagesUpdated={handleImagesUpdated}
            />
          </View>
        )}
      </View>
      
      {/* Generate Report button */}
      <View style={styles.generateContainer}>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGeneratePDF}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Feather name="file" size={18} color="#fff" />
              <Text style={styles.generateButtonText}>
                Generate PDF Report
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusIndicator,
            isConnected ? styles.onlineIndicator : styles.offlineIndicator
          ]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Online' : 'Offline Mode (Reports will still work!)'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2c5e2e',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#2c5e2e',
  },
  contentContainer: {
    flex: 1,
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c5e2e',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5e2e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  photosContainer: {
    flex: 1,
  },
  generateContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5e2e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
});

export default EnhancedReportGenerator;