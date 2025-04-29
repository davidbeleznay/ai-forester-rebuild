import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Switch,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, CULVERT_SIZES, CULVERT_CONSTANTS } from '../../constants/constants';
import { useNetwork } from '../../utils/NetworkContext';
import PDFGenerator from '../../utils/PDFGenerator';

/**
 * Culvert Calculator Screen
 * Simple calculator for culvert sizing with streamlined interface
 */
const CulvertCalculator = ({ navigation }) => {
  // Form input states
  const [streamId, setStreamId] = useState('');
  const [location, setLocation] = useState('');
  const [useGps, setUseGps] = useState(true);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);

  // California method - one set of measurements
  const [topWidth, setTopWidth] = useState('');
  const [depth, setDepth] = useState('');
  const [bottomWidth, setBottomWidth] = useState('');

  // Area-based method
  const [watershedArea, setWatershedArea] = useState('');
  const [precipitation, setPrecipitation] = useState('');
  const [runoffCoefficient, setRunoffCoefficient] = useState('0.45');

  // Climate factors
  const [climateFactorEnabled, setClimateFactorEnabled] = useState(false);
  const [climateFactor, setClimateFactor] = useState('1.2');
  
  const [comments, setComments] = useState('');

  // Transport assessment states
  const [showTransportAssessment, setShowTransportAssessment] = useState(false);
  const [bankfullWidth, setBankfullWidth] = useState('low');
  const [sedimentStorage, setSedimentStorage] = useState('low');
  const [woodyDebris, setWoodyDebris] = useState('none');

  // UI states
  const [calculationMethod, setCalculationMethod] = useState('california');
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Results states
  const [culvertArea, setCulvertArea] = useState(0);
  const [flowCapacity, setFlowCapacity] = useState(0);
  const [recommendedSize, setRecommendedSize] = useState(0);
  const [requiresProfessionalDesign, setRequiresProfessionalDesign] = useState(false);
  const [transportScore, setTransportScore] = useState(0);
  const [transportCategory, setTransportCategory] = useState('');
  const [transportRecommendations, setTransportRecommendations] = useState([]);
  const [transportSizing, setTransportSizing] = useState(0);

  const { isConnected } = useNetwork();

  // Get location when GPS option is enabled
  useEffect(() => {
    if (useGps) {
      getLocation();
    } else {
      setGpsCoordinates(null);
    }
  }, [useGps]);

  // Get current location
  const getLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 15000,
      });

      setGpsCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError('Could not get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  // Toggle calculation method
  const toggleCalculationMethod = () => {
    setCalculationMethod(calculationMethod === 'california' ? 'area-based' : 'california');
  };

  // Calculate culvert size
  const calculateCulvert = () => {
    try {
      setLoading(true);

      // Validate required fields based on calculation method
      if (calculationMethod === 'california') {
        if (!streamId || !location || !topWidth || !depth) {
          Alert.alert('Missing Fields', 'Please fill in stream ID, location, top width, and depth measurements.');
          setLoading(false);
          return;
        }

        // Calculate using California Method with a single measurement
        // Using a simplified trapezoidal formula
        const tw = parseFloat(topWidth);
        const d = parseFloat(depth);
        const bw = bottomWidth ? parseFloat(bottomWidth) : tw * 0.5; // Default bottom width to 50% of top width if not provided
        
        // Calculate cross-sectional area using trapezoidal formula
        const crossSectionalArea = ((tw + bw) / 2) * d;

        // Multiply by 3 to get culvert area as per California Method
        const area = crossSectionalArea * 3;
        
        // Estimate flow capacity
        const flow = area * 1.5; // simplified flow calculation

        setCulvertArea(area);
        setFlowCapacity(flow);
      } else {
        // Area-based method
        if (!streamId || !location || !watershedArea || !precipitation) {
          Alert.alert('Missing Fields', 'Please fill in stream ID, location, watershed area, and precipitation intensity.');
          setLoading(false);
          return;
        }

        // Calculate using Area-Based Method
        // 1. Parse input values
        const area = parseFloat(watershedArea);
        const precip = parseFloat(precipitation);
        const runoff = parseFloat(runoffCoefficient) || CULVERT_CONSTANTS.runoffCoefficient;
        
        // 2. Apply climate factor if enabled
        let climate = 1.0;
        if (climateFactorEnabled) {
          climate = parseFloat(climateFactor) || CULVERT_CONSTANTS.climateFactor;
        }

        // 3. Calculate flow using the rational method (Q = CIA)
        const baseFlow = runoff * precip * area * 0.00278;
        const flow = baseFlow * climate;
        
        // 4. Calculate culvert area based on flow
        const culvArea = flow / 1.5;

        setCulvertArea(culvArea);
        setFlowCapacity(flow);
      }

      // Calculate water transport potential if enabled
      if (showTransportAssessment) {
        calculateTransportScore();
      }

      // Calculate recommended size
      calculateRecommendedSize();

      // Show results
      setShowResults(true);
    } catch (error) {
      console.error('Error calculating culvert size:', error);
      Alert.alert('Calculation Error', 'An error occurred during calculation. Please check your input values.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate water transport potential score
  const calculateTransportScore = () => {
    let score = 0;
    
    // Score based on bankfull width
    if (bankfullWidth === 'low') {
      score += 1;
    } else if (bankfullWidth === 'medium') {
      score += 2;
    } else if (bankfullWidth === 'high') {
      score += 3;
    }
    
    // Score based on sediment storage
    if (sedimentStorage === 'low') {
      score += 1;
    } else if (sedimentStorage === 'medium') {
      score += 2;
    } else if (sedimentStorage === 'high') {
      score += 3;
    }
    
    // Score based on woody debris
    if (woodyDebris === 'none') {
      score += 0;
    } else if (woodyDebris === 'small') {
      score += 1;
    } else if (woodyDebris === 'large') {
      score += 2;
    } else if (woodyDebris === 'logs') {
      score += 3;
    }
    
    // Determine risk category and recommendations
    let category = '';
    let sizing = 0;
    let recommendations = [];
    
    if (score <= 3) {
      category = 'Low';
      sizing = 0;
      recommendations = [
        'Standard culvert installation is suitable',
        'Regular maintenance schedule recommended'
      ];
    } else if (score <= 6) {
      category = 'Medium';
      sizing = 0.2; // 20% additional sizing
      recommendations = [
        'Consider beveled inlet for improved flow',
        'Install energy dissipators at outlet',
        'Schedule semi-annual inspections',
        'Size culvert 20% larger than hydraulic requirements'
      ];
    } else {
      category = 'High';
      sizing = 0.5; // 50% additional sizing
      recommendations = [
        'Size culvert at least 50% larger than hydraulic requirements',
        'Use mitered inlet with headwall',
        'Install outlet apron and energy dissipators',
        'Consider debris rack upstream',
        'Implement quarterly inspection and maintenance',
        'Professional engineering review recommended'
      ];
    }
    
    setTransportScore(score);
    setTransportCategory(category);
    setTransportRecommendations(recommendations);
    setTransportSizing(sizing);
  };

  // Calculate recommended culvert size
  const calculateRecommendedSize = () => {
    // Calculate diameter from area (circular pipe: A = πr²)
    // d = 2 * sqrt(A / π) * 1000 (convert to mm)
    let requiredArea = culvertArea;
    
    // Apply transport sizing factor if applicable
    if (showTransportAssessment && transportSizing > 0) {
      requiredArea = requiredArea * (1 + transportSizing);
    }
    
    const calculatedDiameter = 2 * Math.sqrt(requiredArea / Math.PI) * 1000;
    
    // Find the next largest standard size
    let recommended = 0;
    for (const size of CULVERT_SIZES) {
      if (size >= calculatedDiameter) {
        recommended = size;
        break;
      }
    }
    
    // If no standard size is large enough, use the largest one and flag for professional design
    if (recommended === 0) {
      recommended = CULVERT_SIZES[CULVERT_SIZES.length - 1];
      setRequiresProfessionalDesign(true);
    } else if (recommended >= 2000) {
      // Culverts 2000mm or larger require professional design
      setRequiresProfessionalDesign(true);
    } else {
      setRequiresProfessionalDesign(false);
    }
    
    setRecommendedSize(recommended);
  };

  // Generate and share PDF report
  const generatePDF = async () => {
    try {
      setGeneratingPDF(true);
      
      // Create field card with calculated data
      const fieldCard = {
        streamId,
        location,
        gpsCoordinates,
        calculationMethod,
        comments,
      };
      
      // Add method-specific data
      if (calculationMethod === 'california') {
        // California method with a single measurement
        const tw = parseFloat(topWidth);
        const d = parseFloat(depth);
        const bw = bottomWidth ? parseFloat(bottomWidth) : tw * 0.5;
        
        // Calculate cross-sectional area
        const crossSectionalArea = ((tw + bw) / 2) * d;

        Object.assign(fieldCard, {
          topWidth: tw,
          depth: d,
          bottomWidth: bw,
          crossSectionalArea,
        });
      } else {
        const area = parseFloat(watershedArea);
        const precip = parseFloat(precipitation);
        const runoff = parseFloat(runoffCoefficient);
        
        Object.assign(fieldCard, {
          watershedArea: area,
          precipitation: precip,
          runoffCoefficient: runoff,
          climateFactorEnabled,
          climateFactor: climateFactorEnabled ? parseFloat(climateFactor) : null,
        });
      }
      
      // Add transport assessment data if enabled
      if (showTransportAssessment) {
        Object.assign(fieldCard, {
          transportAssessment: {
            score: transportScore,
            category: transportCategory,
            additionalSizing: transportSizing,
            recommendations: transportRecommendations,
          },
        });
      }
      
      // Get photos associated with the assessment (if any)
      try {
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
        console.error('Error getting photos:', error);
        
        // Try without photos if there was an error
        const result = await PDFGenerator.generateAndSharePDF(
          fieldCard,
          recommendedSize,
          culvertArea,
          flowCapacity,
          calculationMethod,
          requiresProfessionalDesign,
          []
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to generate PDF');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF report. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Save assessment to storage
  const saveAssessment = async () => {
    try {
      setLoading(true);
      
      // Create assessment record with current values and results
      const assessment = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        streamId,
        location,
        gpsCoordinates,
        calculationMethod,
        culvertArea,
        flowCapacity,
        recommendedSize,
        requiresProfessionalDesign,
        comments,
        // Add method-specific data
        californiaMethod: calculationMethod === 'california' ? {
          topWidth,
          depth,
          bottomWidth,
        } : null,
        areaBasedMethod: calculationMethod === 'area-based' ? {
          watershedArea,
          precipitation,
          runoffCoefficient,
          climateFactorEnabled,
          climateFactor,
        } : null,
        // Add transport assessment data if enabled
        transportAssessment: showTransportAssessment ? {
          bankfullWidth,
          sedimentStorage,
          woodyDebris,
          score: transportScore,
          category: transportCategory,
          additionalSizing: transportSizing,
          recommendations: transportRecommendations,
        } : null,
      };
      
      // Get existing assessments or initialize empty array
      try {
        const existingAssessmentsJson = await AsyncStorage.getItem('@culvert_assessments');
        const existingAssessments = existingAssessmentsJson ? JSON.parse(existingAssessmentsJson) : [];
        
        // Add new assessment
        const updatedAssessments = [...existingAssessments, assessment];
        
        // Save to storage
        await AsyncStorage.setItem('@culvert_assessments', JSON.stringify(updatedAssessments));
        
        Alert.alert('Success', 'Assessment saved successfully.');
      } catch (error) {
        console.error('Error with AsyncStorage:', error);
        Alert.alert('Success', 'Calculation completed successfully.');
      }
    } catch (error) {
      console.error('Error saving assessment:', error);
      Alert.alert('Error', 'Failed to save assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    // Reset all form inputs
    setStreamId('');
    setLocation('');
    setUseGps(true);
    setGpsCoordinates(null);
    setTopWidth('');
    setDepth('');
    setBottomWidth('');
    setWatershedArea('');
    setPrecipitation('');
    setRunoffCoefficient('0.45');
    setClimateFactorEnabled(false);
    setClimateFactor('1.2');
    setComments('');
    
    // Reset transport assessment
    setShowTransportAssessment(false);
    setBankfullWidth('low');
    setSedimentStorage('low');
    setWoodyDebris('none');
    
    // Reset results
    setShowResults(false);
    setCulvertArea(0);
    setFlowCapacity(0);
    setRecommendedSize(0);
    setRequiresProfessionalDesign(false);
    setTransportScore(0);
    setTransportCategory('');
    setTransportRecommendations([]);
    setTransportSizing(0);
    
    // Default to California Method
    setCalculationMethod('california');
  };

  // Render the calculation form
  const renderForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Site Information</Text>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Stream/Culvert ID *</Text>
          <TextInput
            style={styles.formInput}
            value={streamId}
            onChangeText={setStreamId}
            placeholder="Enter stream or culvert ID"
          />
        </View>
        
        <View style={styles.formField}>
          <Text style={styles.formLabel}>Location *</Text>
          <TextInput
            style={styles.formInput}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location description"
          />
        </View>
        
        <View style={styles.switchField}>
          <Text style={styles.formLabel}>Use GPS Location</Text>
          <Switch
            value={useGps}
            onValueChange={setUseGps}
            trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
            thumbColor={useGps ? COLORS.primary : '#f4f3f4'}
          />
        </View>
        
        {useGps && gpsCoordinates && (
          <View style={styles.gpsInfo}>
            <Text style={styles.gpsText}>
              Lat: {gpsCoordinates.latitude.toFixed(6)}, Lon: {gpsCoordinates.longitude.toFixed(6)}
            </Text>
            <Text style={styles.gpsAccuracy}>Accuracy: ±{gpsCoordinates.accuracy.toFixed(0)}m</Text>
          </View>
        )}
        
        {useGps && locationLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Getting location...</Text>
          </View>
        )}
        
        {useGps && locationError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        )}
      </View>

      <View style={styles.methodToggle}>
        <Text style={styles.methodToggleLabel}>Calculation Method:</Text>
        <TouchableOpacity
          style={styles.methodToggleButton}
          onPress={toggleCalculationMethod}
        >
          <Text style={styles.methodToggleButtonText}>
            {calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}
          </Text>
          <Feather name="refresh-cw" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      
      {/* California Method Fields - Simplified to just one measurement */}
      {calculationMethod === 'california' && (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Stream Measurements</Text>
          
          <View style={styles.measurementRow}>
            <View style={styles.measurementField}>
              <Text style={styles.formLabel}>Top Width (m) *</Text>
              <TextInput
                style={styles.formInput}
                value={topWidth}
                onChangeText={setTopWidth}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.measurementField}>
              <Text style={styles.formLabel}>Depth (m) *</Text>
              <TextInput
                style={styles.formInput}
                value={depth}
                onChangeText={setDepth}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Bottom Width (m) (optional)</Text>
            <TextInput
              style={styles.formInput}
              value={bottomWidth}
              onChangeText={setBottomWidth}
              placeholder="If blank, default is 50% of top width"
              keyboardType="numeric"
            />
          </View>
          
          {/* Climate Factor for California Method too */}
          <View style={styles.switchField}>
            <Text style={styles.formLabel}>Apply Climate Change Factor</Text>
            <Switch
              value={climateFactorEnabled}
              onValueChange={setClimateFactorEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={climateFactorEnabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>
          
          {climateFactorEnabled && (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Climate Change Factor</Text>
              <TextInput
                style={styles.formInput}
                value={climateFactor}
                onChangeText={setClimateFactor}
                placeholder="1.2"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      )}
      
      {/* Area-Based Method Fields */}
      {calculationMethod === 'area-based' && (
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Watershed Parameters</Text>
          
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Watershed Area (km²) *</Text>
            <TextInput
              style={styles.formInput}
              value={watershedArea}
              onChangeText={setWatershedArea}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Precipitation Intensity (mm/hr) *</Text>
            <TextInput
              style={styles.formInput}
              value={precipitation}
              onChangeText={setPrecipitation}
              placeholder="0.00"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.formField}>
            <Text style={styles.formLabel}>Runoff Coefficient</Text>
            <TextInput
              style={styles.formInput}
              value={runoffCoefficient}
              onChangeText={setRunoffCoefficient}
              placeholder="0.45"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.switchField}>
            <Text style={styles.formLabel}>Apply Climate Change Factor</Text>
            <Switch
              value={climateFactorEnabled}
              onValueChange={setClimateFactorEnabled}
              trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
              thumbColor={climateFactorEnabled ? COLORS.primary : '#f4f3f4'}
            />
          </View>
          
          {climateFactorEnabled && (
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Climate Change Factor</Text>
              <TextInput
                style={styles.formInput}
                value={climateFactor}
                onChangeText={setClimateFactor}
                placeholder="1.2"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>
      )}
      
      <View style={styles.formSection}>
        <View style={styles.switchField}>
          <Text style={styles.formLabel}>Include Transport Assessment</Text>
          <Switch
            value={showTransportAssessment}
            onValueChange={setShowTransportAssessment}
            trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
            thumbColor={showTransportAssessment ? COLORS.primary : '#f4f3f4'}
          />
        </View>
        
        {showTransportAssessment && (
          <View style={styles.transportAssessment}>
            <Text style={styles.sectionSubtitle}>Water Transport Potential</Text>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Bankfull Width Rating</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[styles.selectOption, bankfullWidth === 'low' && styles.selectedOption]}
                  onPress={() => setBankfullWidth('low')}
                >
                  <Text style={styles.selectText}>Low (≤2m)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, bankfullWidth === 'medium' && styles.selectedOption]}
                  onPress={() => setBankfullWidth('medium')}
                >
                  <Text style={styles.selectText}>Medium (>2-3.5m)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, bankfullWidth === 'high' && styles.selectedOption]}
                  onPress={() => setBankfullWidth('high')}
                >
                  <Text style={styles.selectText}>High (>3.5m)</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Sediment in Storage Wedges</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[styles.selectOption, sedimentStorage === 'low' && styles.selectedOption]}
                  onPress={() => setSedimentStorage('low')}
                >
                  <Text style={styles.selectText}>Low (≤100mm)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, sedimentStorage === 'medium' && styles.selectedOption]}
                  onPress={() => setSedimentStorage('medium')}
                >
                  <Text style={styles.selectText}>Medium (>100-200mm)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, sedimentStorage === 'high' && styles.selectedOption]}
                  onPress={() => setSedimentStorage('high')}
                >
                  <Text style={styles.selectText}>High (>200mm)</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Water-transported Woody Debris</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={[styles.selectOption, woodyDebris === 'none' && styles.selectedOption]}
                  onPress={() => setWoodyDebris('none')}
                >
                  <Text style={styles.selectText}>None</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, woodyDebris === 'small' && styles.selectedOption]}
                  onPress={() => setWoodyDebris('small')}
                >
                  <Text style={styles.selectText}>Small</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, woodyDebris === 'large' && styles.selectedOption]}
                  onPress={() => setWoodyDebris('large')}
                >
                  <Text style={styles.selectText}>Large</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.selectOption, woodyDebris === 'logs' && styles.selectedOption]}
                  onPress={() => setWoodyDebris('logs')}
                >
                  <Text style={styles.selectText}>Logs</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Field Notes</Text>
        <TextInput
          style={styles.textArea}
          value={comments}
          onChangeText={setComments}
          placeholder="Enter any additional notes or observations"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
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

  // Render the results modal
  const renderResultsModal = () => (
    <Modal
      visible={showResults}
      transparent={true}
      animationType="slide"
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
              <Feather name="x" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.resultSection}>
              <Text style={styles.resultTitle}>Recommended Culvert Size</Text>
              <Text style={styles.resultSize}>{recommendedSize} mm</Text>
              <Text style={styles.resultSizeMetric}>({(recommendedSize/1000).toFixed(2)} m)</Text>
              
              {requiresProfessionalDesign && (
                <View style={styles.warningContainer}>
                  <Feather name="alert-triangle" size={18} color="#FFC107" style={styles.warningIcon} />
                  <Text style={styles.warningText}>
                    Professional engineering design is recommended for this installation.
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.resultDetails}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Calculation Method:</Text>
                <Text style={styles.resultValue}>
                  {calculationMethod === 'california' ? 'California Method' : 'Area-Based Method'}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Cross-sectional Area:</Text>
                <Text style={styles.resultValue}>{culvertArea.toFixed(2)} m²</Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Flow Capacity:</Text>
                <Text style={styles.resultValue}>{flowCapacity.toFixed(2)} m³/s</Text>
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
                <Text style={styles.visualizationLabel}>{recommendedSize} mm</Text>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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
    marginBottom: 10,
  },
  visualizationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  culvertCircle: {
    backgroundColor: COLORS.primary,
    margin: 20,
  },
  visualizationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
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