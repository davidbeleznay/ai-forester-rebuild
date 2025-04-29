import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { generatePDF } from '../../utils/pdfGenerator';
import { saveFormData } from '../../utils/storage';
import { COLORS, SPACING } from '../../styles/theme';

const CulvertCalculator = ({ navigation }) => {
  // Form state
  const [catchmentArea, setCatchmentArea] = useState('');
  const [runoffCoefficient, setRunoffCoefficient] = useState('0.45');
  const [rainfallIntensity, setRainfallIntensity] = useState('');
  const [maxFlowVelocity, setMaxFlowVelocity] = useState('3.0');
  const [culvertType, setCulvertType] = useState('round');
  const [notes, setNotes] = useState('');
  
  // Calculation state
  const [calculatedDiameter, setCalculatedDiameter] = useState(null);
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  // Climate factor state
  const [climateFactorEnabled, setClimateFactorEnabled] = useState(false);
  const [climateFactor, setClimateFactor] = useState('1.2');
  
  // Transport assessment state
  const [showTransportAssessment, setShowTransportAssessment] = useState(false);
  const [roadWidth, setRoadWidth] = useState('');
  const [trafficVolume, setTrafficVolume] = useState('low');
  const [roadImportance, setRoadImportance] = useState('low');
  const [transportScore, setTransportScore] = useState(0);
  const [transportCategory, setTransportCategory] = useState('Low');
  const [transportSizing, setTransportSizing] = useState(1);
  const [transportRecommendations, setTransportRecommendations] = useState([]);
  
  // Location state
  const [location, setLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Connection state
  const [isConnected, setIsConnected] = useState(true);
  
  // Photo state
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [photos, setPhotos] = useState([]);
  const cameraRef = useRef(null);
  
  // Standard culvert sizes in mm
  const standardSizes = [300, 375, 450, 525, 600, 750, 900, 1050, 1200, 1350, 1500, 1650, 1800];
  
  useEffect(() => {
    // Check network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    // Request camera permissions
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const getLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permissions are required for GPS tagging.');
        setIsGettingLocation(false);
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setLocation(location.coords);
      setLocationAccuracy(location.coords.accuracy);
    } catch (error) {
      Alert.alert('Error', 'Failed to get location: ' + error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync();
      
      setPhotos([
        ...photos,
        {
          uri: photo.uri,
          timestamp: new Date().toISOString(),
          comment: ''
        }
      ]);
      
      setCameraVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture: ' + error.message);
    }
  };
  
  const removePhoto = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
  };
  
  const updatePhotoComment = (index, comment) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].comment = comment;
    setPhotos(updatedPhotos);
  };
  
  const calculateCulvert = () => {
    if (!catchmentArea || !rainfallIntensity) {
      Alert.alert('Missing Information', 'Please enter catchment area and rainfall intensity.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculate peak flow (Q = CIA)
      const area = parseFloat(catchmentArea);
      const coefficient = parseFloat(runoffCoefficient);
      const intensity = parseFloat(rainfallIntensity);
      const velocity = parseFloat(maxFlowVelocity);
      
      // Apply climate factor if enabled
      const factor = climateFactorEnabled ? parseFloat(climateFactor) : 1.0;
      
      // Calculate peak flow (Q = CIA)
      const peakFlow = coefficient * intensity * area * factor / 360; // m3/s
      
      // Calculate required area (A = Q/V)
      const requiredArea = peakFlow / velocity; // m2
      
      // For round culverts:
      // Calculate diameter: D = 2 * sqrt(A/π)
      const diameterMeters = 2 * Math.sqrt(requiredArea / Math.PI);
      const diameterMillimeters = diameterMeters * 1000;
      
      console.log('Calculated diameter (mm):', diameterMillimeters);
      setCalculatedDiameter(diameterMillimeters);
      
      // Find the next standard size
      let selectedSize = null;
      for (const size of standardSizes) {
        if (size >= diameterMillimeters) {
          selectedSize = size;
          break;
        }
      }
      
      // If all standard sizes are smaller than required, use the largest one
      if (selectedSize === null && standardSizes.length > 0) {
        selectedSize = standardSizes[standardSizes.length - 1];
      }
      
      setRecommendedSize(selectedSize);
      
      // Calculate transport assessment if enabled
      if (showTransportAssessment) {
        calculateTransportAssessment();
      }
      
      setShowResults(true);
    } catch (error) {
      Alert.alert('Calculation Error', error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateTransportAssessment = () => {
    // Calculate transport score based on inputs
    let score = 0;
    
    // Road width score (0-3)
    const width = parseFloat(roadWidth);
    if (width > 8) score += 3;
    else if (width > 6) score += 2;
    else if (width > 4) score += 1;
    
    // Traffic volume score (0-3)
    if (trafficVolume === 'high') score += 3;
    else if (trafficVolume === 'medium') score += 2;
    else score += 1;
    
    // Road importance score (0-3)
    if (roadImportance === 'high') score += 3;
    else if (roadImportance === 'medium') score += 2;
    else score += 1;
    
    setTransportScore(score);
    
    // Determine risk category and sizing factor
    let category, sizing, recommendations = [];
    
    if (score >= 7) {
      category = 'High';
      sizing = 1.3;
      recommendations = [
        'Consider more conservative design standards',
        'Implement full-width concrete headwalls',
        'Include additional overflow management',
        'Schedule regular inspections every 6 months'
      ];
    } else if (score >= 4) {
      category = 'Medium';
      sizing = 1.2;
      recommendations = [
        'Install erosion protection at inlet and outlet',
        'Include marker posts at culvert location',
        'Schedule annual inspections'
      ];
    } else {
      category = 'Low';
      sizing = 1.1;
      recommendations = [
        'Standard installation practices are sufficient',
        'Schedule inspections every 2 years'
      ];
    }
    
    setTransportCategory(category);
    setTransportSizing(sizing);
    setTransportRecommendations(recommendations);
    
    // Apply transport sizing factor to recommended size
    if (recommendedSize) {
      // Find the next standard size
      let adjustedSize = recommendedSize * sizing;
      let newSize = null;
      
      for (const size of standardSizes) {
        if (size >= adjustedSize) {
          newSize = size;
          break;
        }
      }
      
      // If all standard sizes are smaller than required, use the largest one
      if (newSize === null && standardSizes.length > 0) {
        newSize = standardSizes[standardSizes.length - 1];
      }
      
      setRecommendedSize(newSize);
    }
  };
  
  const resetForm = () => {
    setCatchmentArea('');
    setRainfallIntensity('');
    setRunoffCoefficient('0.45');
    setMaxFlowVelocity('3.0');
    setCulvertType('round');
    setNotes('');
    setLocation(null);
    setLocationAccuracy(null);
    setClimateFactorEnabled(false);
    setClimateFactor('1.2');
    setShowTransportAssessment(false);
    setRoadWidth('');
    setTrafficVolume('low');
    setRoadImportance('low');
    setPhotos([]);
    setCalculatedDiameter(null);
    setRecommendedSize(null);
    setShowResults(false);
  };
  
  const saveAssessment = async () => {
    setLoading(true);
    
    try {
      // Prepare data to save
      const assessmentData = {
        id: `culvert-${Date.now()}`,
        type: 'culvert',
        timestamp: new Date().toISOString(),
        location: location,
        inputs: {
          catchmentArea,
          runoffCoefficient,
          rainfallIntensity,
          maxFlowVelocity,
          culvertType,
          climateFactor: climateFactorEnabled ? climateFactor : null,
          transportAssessment: showTransportAssessment ? {
            roadWidth,
            trafficVolume,
            roadImportance
          } : null
        },
        results: {
          calculatedDiameter,
          recommendedSize,
          transportScore: showTransportAssessment ? transportScore : null,
          transportCategory: showTransportAssessment ? transportCategory : null
        },
        photos: photos,
        notes
      };
      
      // Save photos to permanent storage
      const savedPhotos = [];
      for (const photo of photos) {
        const filename = `${assessmentData.id}-${savedPhotos.length}.jpg`;
        const newUri = `${FileSystem.documentDirectory}photos/${filename}`;
        
        // Ensure directory exists
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}photos/`,
          { intermediates: true }
        );
        
        // Copy file
        await FileSystem.copyAsync({
          from: photo.uri,
          to: newUri
        });
        
        savedPhotos.push({
          uri: newUri,
          comment: photo.comment,
          timestamp: photo.timestamp
        });
      }
      
      // Update photos with permanent URIs
      assessmentData.photos = savedPhotos;
      
      // Save to storage
      await saveFormData(assessmentData);
      
      Alert.alert(
        'Assessment Saved',
        'The culvert assessment has been saved successfully.',
        [{ text: 'OK', onPress: () => setShowResults(false) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save assessment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    
    try {
      // Prepare data for PDF
      const pdfData = {
        title: 'Culvert Sizing Assessment',
        timestamp: new Date().toISOString(),
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: locationAccuracy
        } : null,
        inputs: {
          catchmentArea: `${catchmentArea} ha`,
          runoffCoefficient,
          rainfallIntensity: `${rainfallIntensity} mm/hr`,
          maxFlowVelocity: `${maxFlowVelocity} m/s`,
          culvertType: culvertType === 'round' ? 'Round' : 'Box'
        },
        results: {
          calculatedDiameter: `${calculatedDiameter ? calculatedDiameter.toFixed(1) : 'N/A'} mm`,
          recommendedSize: `${recommendedSize} mm`
        },
        photos: photos,
        notes
      };
      
      // Include climate factor if enabled
      if (climateFactorEnabled) {
        pdfData.inputs.climateFactor = climateFactor;
      }
      
      // Include transport assessment if enabled
      if (showTransportAssessment) {
        pdfData.transportAssessment = {
          roadWidth: `${roadWidth} m`,
          trafficVolume: trafficVolume.charAt(0).toUpperCase() + trafficVolume.slice(1),
          roadImportance: roadImportance.charAt(0).toUpperCase() + roadImportance.slice(1),
          score: `${transportScore}/9`,
          category: transportCategory,
          recommendations: transportRecommendations
        };
      }
      
      // Generate PDF
      const pdfUri = await generatePDF(pdfData);
      
      Alert.alert(
        'PDF Generated',
        `The PDF has been saved to: ${pdfUri}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF: ' + error.message);
    } finally {
      setGeneratingPDF(false);
    }
  };
  
  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Catchment Details</Text>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Catchment Area (ha)</Text>
          <TextInput
            style={styles.formInput}
            value={catchmentArea}
            onChangeText={setCatchmentArea}
            keyboardType="numeric"
            placeholder="Enter area in hectares"
          />
        </View>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Runoff Coefficient</Text>
          <TextInput
            style={styles.formInput}
            value={runoffCoefficient}
            onChangeText={setRunoffCoefficient}
            keyboardType="numeric"
            placeholder="Default: 0.45"
          />
        </View>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Rainfall Intensity (mm/hr)</Text>
          <TextInput
            style={styles.formInput}
            value={rainfallIntensity}
            onChangeText={setRainfallIntensity}
            keyboardType="numeric"
            placeholder="Enter rainfall intensity"
          />
        </View>
        
        <View style={styles.switchField}>
          <Text style={styles.formLabel}>Apply Climate Change Factor</Text>
          <Switch
            value={climateFactorEnabled}
            onValueChange={setClimateFactorEnabled}
            trackColor={{ false: '#ccc', true: COLORS.primary }}
            thumbColor={climateFactorEnabled ? COLORS.accent : '#f4f3f4'}
          />
        </View>
        
        {climateFactorEnabled && (
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Climate Factor</Text>
            <TextInput
              style={styles.formInput}
              value={climateFactor}
              onChangeText={setClimateFactor}
              keyboardType="numeric"
              placeholder="Default: 1.2"
            />
          </View>
        )}
        
        <TouchableOpacity
          style={styles.switchField}
          onPress={() => getLocation()}
        >
          <Text style={styles.formLabel}>Get GPS Location</Text>
          <Feather name="map-pin" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        {isGettingLocation && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Getting location...</Text>
          </View>
        )}
        
        {location && (
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsText}>
              Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </Text>
            {locationAccuracy && (
              <Text style={styles.gpsAccuracy}>
                Accuracy: ±{locationAccuracy.toFixed(1)}m
              </Text>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Culvert Parameters</Text>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Culvert Type</Text>
          <View style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, backgroundColor: '#f9f9f9' }}>
            <Picker
              selectedValue={culvertType}
              onValueChange={(value) => setCulvertType(value)}
              style={{ height: 50 }}
            >
              <Picker.Item label="Round" value="round" />
              <Picker.Item label="Box" value="box" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Maximum Flow Velocity (m/s)</Text>
          <TextInput
            style={styles.formInput}
            value={maxFlowVelocity}
            onChangeText={setMaxFlowVelocity}
            keyboardType="numeric"
            placeholder="Default: 3.0"
          />
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Transport Assessment</Text>
        
        <View style={styles.switchField}>
          <Text style={styles.formLabel}>Include Transport Assessment</Text>
          <Switch
            value={showTransportAssessment}
            onValueChange={setShowTransportAssessment}
            trackColor={{ false: '#ccc', true: COLORS.primary }}
            thumbColor={showTransportAssessment ? COLORS.accent : '#f4f3f4'}
          />
        </View>
        
        {showTransportAssessment && (
          <View style={styles.transportAssessment}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Road Width (m)</Text>
              <TextInput
                style={styles.formInput}
                value={roadWidth}
                onChangeText={setRoadWidth}
                keyboardType="numeric"
                placeholder="Enter road width"
              />
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Traffic Volume</Text>
              <View style={styles.selectContainer}>
                {['low', 'medium', 'high'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.selectOption,
                      trafficVolume === option && styles.selectedOption
                    ]}
                    onPress={() => setTrafficVolume(option)}
                  >
                    <Text style={styles.selectText}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Road Importance</Text>
              <View style={styles.selectContainer}>
                {['low', 'medium', 'high'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.selectOption,
                      roadImportance === option && styles.selectedOption
                    ]}
                    onPress={() => setRoadImportance(option)}
                  >
                    <Text style={styles.selectText}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Site Photos</Text>
        
        <View style={styles.photoButtonContainer}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={() => hasPermission ? setCameraVisible(true) : alert('Camera permission not granted')}
          >
            <Feather name="camera" size={20} color="#fff" />
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
        
        {photos.length > 0 && (
          <View style={styles.photoList}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <View style={styles.photoDetails}>
                  <TextInput
                    style={styles.photoComment}
                    value={photo.comment}
                    onChangeText={(text) => updatePhotoComment(index, text)}
                    placeholder="Add comment..."
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Feather name="trash-2" size={20} color="#e53935" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Notes</Text>
        <TextInput
          style={styles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Enter any additional notes..."
          multiline
          numberOfLines={4}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.calculateButton, loading && styles.disabledButton]}
          onPress={calculateCulvert}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.buttonText}>Calculate</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={resetForm}
        >
          <Feather name="refresh-cw" size={20} color="#e53935" />
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderResultsModal = () => (
    <Modal
      visible={showResults}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowResults(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Culvert Size Results</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowResults(false)}
            >
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>Recommended Culvert Size</Text>
              <Text style={styles.resultSize}>{recommendedSize}</Text>
              <Text style={styles.resultSizeMetric}>millimeters</Text>
              
              {recommendedSize >= 1500 && (
                <View style={styles.warningContainer}>
                  <Feather name="alert-triangle" size={20} color="#FFC107" style={styles.warningIcon} />
                  <Text style={styles.warningText}>
                    Large culvert size detected. Consider consulting with an engineer for detailed design.
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Calculated Diameter:</Text>
                <Text style={styles.resultValue}>{calculatedDiameter ? calculatedDiameter.toFixed(1) : 'N/A'} mm</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Rounded to Standard Size:</Text>
                <Text style={styles.resultValue}>{recommendedSize} mm</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Catchment Area:</Text>
                <Text style={styles.resultValue}>{catchmentArea} ha</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Rainfall Intensity:</Text>
                <Text style={styles.resultValue}>{rainfallIntensity} mm/hr</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Runoff Coefficient:</Text>
                <Text style={styles.resultValue}>{runoffCoefficient}</Text>
              </View>
              
              {climateFactorEnabled && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Climate Factor Applied:</Text>
                  <Text style={styles.resultValue}>{climateFactor}x</Text>
                </View>
              )}
            </View>
            
            {showTransportAssessment && (
              <View style={styles.transportResults}>
                <Text style={styles.resultTitle}>Transport Assessment</Text>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Risk Category:</Text>
                  <Text 
                    style={[
                      styles.resultValue, 
                      transportCategory === 'High' ? styles.highRisk : 
                      transportCategory === 'Medium' ? styles.mediumRisk : 
                      styles.lowRisk
                    ]}
                  >
                    {transportCategory}
                  </Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Transport Score:</Text>
                  <Text style={styles.resultValue}>{transportScore}/9</Text>
                </View>
                
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Additional Sizing:</Text>
                  <Text style={styles.resultValue}>{transportSizing * 100}%</Text>
                </View>
                
                {transportRecommendations.length > 0 && (
                  <View style={styles.recommendationsContainer}>
                    <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                    {transportRecommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View style={styles.recommendationBullet} />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.culvertVisualization}>
              <Text style={styles.visualizationTitle}>Size Visualization</Text>
              
              <View style={styles.visualizationContainer}>
                {/* Stream cross-section */}
                <View style={styles.circlesContainer}>
                  <View 
                    style={[
                      styles.streamCircle,
                      { 
                        width: Math.min(280, 280), 
                        height: Math.min(280, 280),
                        borderRadius: 140
                      }
                    ]}
                  />
                  
                  {/* Recommended culvert */}
                  <View 
                    style={[
                      styles.culvertCircle,
                      { 
                        width: Math.min(250, recommendedSize / 8), 
                        height: Math.min(250, recommendedSize / 8),
                        borderRadius: Math.min(125, recommendedSize / 16)
                      }
                    ]}
                  />
                  
                  {/* Labels */}
                  <View style={styles.circleLabels}>
                    <Text style={styles.streamLabel}>Stream</Text>
                    <Text style={styles.culvertLabel}>{recommendedSize} mm Culvert</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
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
              
              <TouchableOpacity
                style={[styles.actionButton, styles.pdfButton, generatingPDF && styles.disabledButton]}
                onPress={handleGeneratePDF}
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
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

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
        <Text style={styles.headerTitle}>Culvert Calculator</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {renderForm()}
      </ScrollView>
      
      {renderResultsModal()}
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
  formContainer: {
    padding: SPACING.md,
  },
  formSection: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  formField: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  switchField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  measurementField: {
    width: '48%',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  calculateButton: {
    backgroundColor: COLORS.primary,
    flex: 2,
    marginRight: 8,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#e53935',
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e53935',
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  gpsInfo: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  gpsText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  gpsAccuracy: {
    fontSize: 12,
    color: '#388e3c',
    marginTop: 2,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 8,
    borderRadius: 6,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
  },
  methodToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  methodToggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginRight: 10,
  },
  methodToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 6,
  },
  methodToggleButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 8,
  },
  transportAssessment: {
    marginTop: SPACING.sm,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  selectOption: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  selectText: {
    fontSize: 14,
    color: COLORS.text,
  },
  // Photo Section Styles
  photoButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  photoButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  photoList: {
    marginTop: SPACING.sm,
  },
  photoItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumbnail: {
    width: 90,
    height: 90,
  },
  photoDetails: {
    flex: 1,
    padding: SPACING.sm,
  },
  photoComment: {
    flex: 1,
    fontSize: 14,
    minHeight: 50,
  },
  removePhotoButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  closeButton: {
    padding: 5,
  },
  modalScrollView: {
    padding: SPACING.md,
  },
  resultSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  resultSize: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  resultSizeMetric: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF8E1',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    padding: 12,
    marginTop: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#5D4037',
  },
  resultDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: SPACING.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  transportResults: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: SPACING.md,
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
    marginTop: 10,
  },
  recommendationsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  culvertVisualization: {
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  visualizationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 15,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  circlesContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  streamCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(173, 216, 230, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 255, 0.5)',
    zIndex: 1,
  },
  culvertCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(144, 238, 144, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(0, 128, 0, 0.7)',
    borderStyle: 'dashed',
    zIndex: 2,
  },
  circleLabels: {
    position: 'absolute',
    top: -40,
    alignItems: 'center',
    zIndex: 3,
  },
  streamLabel: {
    color: 'rgba(0, 0, 255, 0.7)',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  culvertLabel: {
    color: 'rgba(0, 128, 0, 0.9)',
    fontWeight: 'bold',
  },
  visualizationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 10,
  },
  actionButtons: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  pdfButton: {
    backgroundColor: COLORS.secondary,
  },
});

export default CulvertCalculator;