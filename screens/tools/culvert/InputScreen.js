import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  Button,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

// Import components and utilities
import FieldInput from '../../../components/forms/FieldInput';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';
import { calculateCulvertSize, calculateCulvertDiameterAdvanced } from '../../../utils/calculations/culvertCalculator';
import { saveFieldCard } from '../../../utils/storage/fieldCardStorage';

/**
 * Culvert Tool Input Screen
 * Form for entering stream measurements using the California Method
 */
const InputScreen = ({ navigation }) => {
  // Basic form data
  const [formData, setFormData] = useState({
    streamId: '',
    location: '',
  });

  // Stream measurements - Using California Method
  const [topWidths, setTopWidths] = useState(['']); // Multiple top width measurements
  const [bottomWidth, setBottomWidth] = useState(''); // One bottom width measurement
  const [depths, setDepths] = useState(['']); // Multiple depth measurements
  
  // Secondary data
  const [watershedArea, setWatershedArea] = useState('');
  const [precipitation, setPrecipitation] = useState('50'); // Default value (mm/hr)
  
  // Additional state
  const [useStreamMeasurements, setUseStreamMeasurements] = useState(true);
  
  // Transport & Debris parameters
  const [showTransportSection, setShowTransportSection] = useState(false);
  const [debrisRating, setDebrisRating] = useState('low');
  const [sedimentDepth, setSedimentDepth] = useState('');
  const [logDiameter, setLogDiameter] = useState('');
  
  // Climate change parameters
  const [showClimateSection, setShowClimateSection] = useState(false);
  const [climateScenario, setClimateScenario] = useState('none');
  const [customClimateFactor, setCustomClimateFactor] = useState('');
  
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [errors, setErrors] = useState({});

  // Update basic form field
  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: null,
      });
    }
  };

  // Handle top width measurements
  const handleTopWidthChange = (index, value) => {
    const newTopWidths = [...topWidths];
    newTopWidths[index] = value;
    setTopWidths(newTopWidths);
    
    // Clear error if it exists
    if (errors[`topWidth_${index}`]) {
      setErrors({
        ...errors,
        [`topWidth_${index}`]: null,
      });
    }
  };

  // Add a new top width input field
  const addTopWidthField = () => {
    setTopWidths([...topWidths, '']);
  };

  // Remove a top width input field
  const removeTopWidthField = (index) => {
    if (topWidths.length > 1) {
      const newTopWidths = [...topWidths];
      newTopWidths.splice(index, 1);
      setTopWidths(newTopWidths);
    }
  };

  // Handle depth measurements
  const handleDepthChange = (index, value) => {
    const newDepths = [...depths];
    newDepths[index] = value;
    setDepths(newDepths);
    
    // Clear error if it exists
    if (errors[`depth_${index}`]) {
      setErrors({
        ...errors,
        [`depth_${index}`]: null,
      });
    }
  };

  // Add a new depth input field
  const addDepthField = () => {
    setDepths([...depths, '']);
  };

  // Remove a depth input field
  const removeDepthField = (index) => {
    if (depths.length > 1) {
      const newDepths = [...depths];
      newDepths.splice(index, 1);
      setDepths(newDepths);
    }
  };

  // Handle debris rating selection
  const handleDebrisRatingChange = (rating) => {
    setDebrisRating(rating);
  };

  // Handle climate scenario selection
  const handleClimateScenarioChange = (scenario) => {
    setClimateScenario(scenario);
    
    // Reset custom factor if any standard scenario is selected
    if (scenario !== 'custom') {
      setCustomClimateFactor('');
    }
  };

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate general fields
    if (!formData.streamId) {
      newErrors.streamId = 'Stream/Culvert ID is required';
    }
    
    if (useStreamMeasurements) {
      // Validate top widths
      topWidths.forEach((width, index) => {
        if (!width) {
          newErrors[`topWidth_${index}`] = 'Width is required';
        } else if (isNaN(parseFloat(width))) {
          newErrors[`topWidth_${index}`] = 'Must be a valid number';
        }
      });
      
      // Validate bottom width
      if (!bottomWidth) {
        newErrors.bottomWidth = 'Bottom width is required';
      } else if (isNaN(parseFloat(bottomWidth))) {
        newErrors.bottomWidth = 'Must be a valid number';
      }
      
      // Validate depths
      depths.forEach((depth, index) => {
        if (!depth) {
          newErrors[`depth_${index}`] = 'Depth is required';
        } else if (isNaN(parseFloat(depth))) {
          newErrors[`depth_${index}`] = 'Must be a valid number';
        }
      });
    } else {
      // Validate area-based calculation fields
      if (!watershedArea) {
        newErrors.watershedArea = 'Watershed area is required';
      } else if (isNaN(parseFloat(watershedArea))) {
        newErrors.watershedArea = 'Must be a valid number';
      }
      
      if (!precipitation) {
        newErrors.precipitation = 'Precipitation is required';
      } else if (isNaN(parseFloat(precipitation))) {
        newErrors.precipitation = 'Must be a valid number';
      }
    }
    
    // Validate transport parameters
    if (showTransportSection) {
      if (sedimentDepth && isNaN(parseFloat(sedimentDepth))) {
        newErrors.sedimentDepth = 'Must be a valid number';
      }
      
      if (logDiameter && isNaN(parseFloat(logDiameter))) {
        newErrors.logDiameter = 'Must be a valid number';
      }
    }
    
    // Validate climate parameters
    if (showClimateSection && climateScenario === 'custom') {
      if (!customClimateFactor) {
        newErrors.customClimateFactor = 'Custom factor is required';
      } else if (isNaN(parseFloat(customClimateFactor))) {
        newErrors.customClimateFactor = 'Must be a valid number';
      } else if (parseFloat(customClimateFactor) < 1.0) {
        newErrors.customClimateFactor = 'Factor must be 1.0 or greater';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get current GPS location
  const captureLocation = async () => {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to capture GPS coordinates.');
        return;
      }
      
      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      
      setGpsCoordinates({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
      });
      
      // Also update the location field with coordinates
      setFormData({
        ...formData,
        location: `${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to capture GPS coordinates. Please try again.');
      console.error('GPS error:', error);
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check and correct the form errors.');
      return;
    }
    
    try {
      let culvertSize;
      let calculationResult;
      
      // Prepare transport parameters if section is visible
      const transportParams = showTransportSection ? {
        debrisRating,
        sedimentDepth: sedimentDepth ? parseFloat(sedimentDepth) : 0,
        logDiameter: logDiameter ? parseFloat(logDiameter) : 0
      } : null;
      
      // Prepare climate parameters
      const selectedClimateScenario = showClimateSection ? climateScenario : 'none';
      const climateFactor = showClimateSection && climateScenario === 'custom' && customClimateFactor 
        ? parseFloat(customClimateFactor) 
        : null;
      
      if (useStreamMeasurements) {
        // Use California Method with stream measurements
        const parsedTopWidths = topWidths.map(w => parseFloat(w));
        const parsedBottomWidth = parseFloat(bottomWidth);
        const parsedDepths = depths.map(d => parseFloat(d));
        
        // Calculate using California Method
        calculationResult = calculateCulvertSize({
          topWidths: parsedTopWidths,
          bottomWidth: parsedBottomWidth,
          depths: parsedDepths,
          transportParams,
          climateScenario: selectedClimateScenario,
          climateProjectionFactor: climateFactor
        });
        
        culvertSize = calculationResult.recommendedSize;
      } else {
        // Use area-based method (fallback)
        const parsedWatershedArea = parseFloat(watershedArea);
        const parsedPrecipitation = parseFloat(precipitation);
        
        // Calculate using the area-based method
        calculationResult = calculateCulvertDiameterAdvanced(
          parsedWatershedArea, 
          parsedPrecipitation, 
          {
            transportParams,
            climateScenario: selectedClimateScenario,
            climateProjectionFactor: climateFactor
          }
        );
        
        culvertSize = calculationResult.recommendedSize;
      }
      
      // Create the field card data
      const fieldCard = {
        ...formData,
        calculationMethod: useStreamMeasurements ? 'california' : 'area',
        
        // Include all calculation inputs and results
        ...(useStreamMeasurements 
          ? {
              topWidths: topWidths.map(w => parseFloat(w)),
              bottomWidth: parseFloat(bottomWidth),
              depths: depths.map(d => parseFloat(d)),
              averageTopWidth: calculationResult.averageTopWidth,
              averageDepth: calculationResult.averageDepth,
              crossSectionalArea: calculationResult.crossSectionalArea,
              endOpeningArea: calculationResult.endOpeningArea,
              calculatedDiameter: calculationResult.calculatedDiameter,
              areaBasedSize: calculationResult.areaBased,
              tableBasedSize: calculationResult.tableBased,
              baseSize: calculationResult.baseSize,
            } 
          : {
              watershedArea: parseFloat(watershedArea),
              precipitation: parseFloat(precipitation),
              baseFlowRate: calculationResult.baseFlowRate,
              baseDiameter: calculationResult.baseDiameter,
              baseSize: calculationResult.baseSize,
            }
        ),
        
        // Transport parameters
        transportAssessmentUsed: showTransportSection,
        ...(showTransportSection 
          ? {
              debrisRating,
              sedimentDepth: sedimentDepth ? parseFloat(sedimentDepth) : 0,
              logDiameter: logDiameter ? parseFloat(logDiameter) : 0,
              transportIndex: calculationResult.transportIndex,
              transportRecommendation: calculationResult.transportRecommendation,
              transportTips: calculationResult.transportTips,
              transportAdjustedSize: calculationResult.transportAdjustedSize,
            } 
          : {}
        ),
        
        // Climate parameters
        climateProjectionUsed: showClimateSection,
        ...(showClimateSection 
          ? {
              climateScenario: selectedClimateScenario,
              climateProjectionFactor: climateFactor || 
                (selectedClimateScenario === 'none' ? 1.0 : 
                 selectedClimateScenario === '2050s' ? 1.1 : 
                 selectedClimateScenario === '2080s' ? 1.2 : 1.0),
              climateAdjustedSize: calculationResult.climateAdjustedSize,
            } 
          : {}
        ),
        
        requiresProfessionalDesign: calculationResult.requiresProfessionalDesign || false,
        recommendedSize: culvertSize,
        finalSize: culvertSize,
        gpsCoordinates: gpsCoordinates,
        dateCreated: new Date().toISOString(),
      };
      
      // Navigate to results screen with data
      navigation.navigate('Result', { 
        fieldCard,
        culvertDiameter: culvertSize,
        requiresProfessionalDesign: calculationResult.requiresProfessionalDesign || false,
        calculationMethod: useStreamMeasurements ? 'california' : 'area',
        transportParams: showTransportSection ? transportParams : null,
        climateScenario: showClimateSection ? selectedClimateScenario : 'none',
      });
    } catch (error) {
      Alert.alert('Calculation Error', 'An error occurred while calculating the culvert size.');
      console.error('Calculation error:', error);
    }
  };

  // Navigate to history screen
  const handleViewHistory = () => {
    navigation.navigate('History');
  };

  // Render a rating button for debris rating
  const RatingButton = ({ label, value, selected }) => (
    <TouchableOpacity
      style={[
        styles.ratingButton,
        selected && styles.ratingButtonSelected
      ]}
      onPress={() => handleDebrisRatingChange(value)}
    >
      <Text style={[
        styles.ratingButtonText,
        selected && styles.ratingButtonTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  // Render a climate scenario button
  const ScenarioButton = ({ label, value, selected }) => (
    <TouchableOpacity
      style={[
        styles.scenarioButton,
        selected && styles.scenarioButtonSelected
      ]}
      onPress={() => handleClimateScenarioChange(value)}
    >
      <Text style={[
        styles.scenarioButtonText,
        selected && styles.scenarioButtonTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Culvert Sizing Tool</Text>
            <Text style={styles.description}>
              Enter stream measurements to calculate recommended culvert size using the California Method.
            </Text>
            
            <TouchableOpacity
              style={styles.historyButton}
              onPress={handleViewHistory}
            >
              <Text style={styles.historyButtonText}>View Saved Field Cards</Text>
            </TouchableOpacity>
          </View>
          
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Site Information</Text>
            
            <FieldInput
              label="Stream/Culvert ID"
              value={formData.streamId}
              onChangeText={(value) => handleChange('streamId', value)}
              placeholder="Enter stream or culvert identifier"
              errorText={errors.streamId}
            />
            
            <FieldInput
              label="Location Description"
              value={formData.location}
              onChangeText={(value) => handleChange('location', value)}
              placeholder="Enter location or capture GPS"
              errorText={errors.location}
            />
            
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={captureLocation}
            >
              <Text style={styles.gpsButtonText}>Capture GPS Coordinates</Text>
            </TouchableOpacity>
            
            {gpsCoordinates && (
              <View style={styles.gpsInfo}>
                <Text style={styles.gpsText}>
                  Lat: {gpsCoordinates.latitude.toFixed(5)}, Lon: {gpsCoordinates.longitude.toFixed(5)}
                </Text>
                <Text style={styles.gpsAccuracy}>
                  Accuracy: ±{gpsCoordinates.accuracy.toFixed(1)}m
                </Text>
              </View>
            )}
          </View>
          
          {/* Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sizing Method</Text>
            
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Use Stream Measurements (California Method)</Text>
              <Switch
                trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                thumbColor={useStreamMeasurements ? COLORS.primary : '#f4f3f4'}
                onValueChange={() => setUseStreamMeasurements(!useStreamMeasurements)}
                value={useStreamMeasurements}
              />
            </View>
          </View>
          
          {useStreamMeasurements ? (
            // Stream Measurements - California Method
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stream Measurements</Text>
              <Text style={styles.helperText}>
                Enter all measurements in meters. Take multiple measurements for top width and depth.
              </Text>
              
              {/* Top Width Measurements */}
              <Text style={styles.measurementLabel}>Top Widths (m):</Text>
              {topWidths.map((width, index) => (
                <View key={`width_${index}`} style={styles.measurementRow}>
                  <View style={styles.measurementInput}>
                    <FieldInput
                      label={`Top Width ${index + 1}`}
                      value={width}
                      onChangeText={(value) => handleTopWidthChange(index, value)}
                      placeholder="Enter width"
                      errorText={errors[`topWidth_${index}`]}
                      inputProps={{
                        keyboardType: 'numeric',
                      }}
                    />
                  </View>
                  
                  {topWidths.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeTopWidthField(index)}
                    >
                      <Text style={styles.removeButtonText}>-</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={addTopWidthField}
              >
                <Text style={styles.addButtonText}>+ Add Another Top Width</Text>
              </TouchableOpacity>
              
              {/* Bottom Width */}
              <View style={styles.spaceTop}>
                <FieldInput
                  label="Bottom Width (m)"
                  value={bottomWidth}
                  onChangeText={setBottomWidth}
                  placeholder="Enter bottom width"
                  errorText={errors.bottomWidth}
                  inputProps={{
                    keyboardType: 'numeric',
                  }}
                />
              </View>
              
              {/* Depth Measurements */}
              <Text style={[styles.measurementLabel, styles.spaceTop]}>Depths (m):</Text>
              {depths.map((depth, index) => (
                <View key={`depth_${index}`} style={styles.measurementRow}>
                  <View style={styles.measurementInput}>
                    <FieldInput
                      label={`Depth ${index + 1}`}
                      value={depth}
                      onChangeText={(value) => handleDepthChange(index, value)}
                      placeholder="Enter depth"
                      errorText={errors[`depth_${index}`]}
                      inputProps={{
                        keyboardType: 'numeric',
                      }}
                    />
                  </View>
                  
                  {depths.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeDepthField(index)}
                    >
                      <Text style={styles.removeButtonText}>-</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={addDepthField}
              >
                <Text style={styles.addButtonText}>+ Add Another Depth</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Area-Based Method (fallback)
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watershed Measurements</Text>
              <Text style={styles.helperText}>
                Using area-based calculation method as an alternative to stream measurements.
              </Text>
              
              <FieldInput
                label="Watershed Area (km²)"
                value={watershedArea}
                onChangeText={setWatershedArea}
                placeholder="Enter watershed area"
                errorText={errors.watershedArea}
                inputProps={{
                  keyboardType: 'numeric',
                }}
              />
              
              <FieldInput
                label="Precipitation Intensity (mm/hr)"
                value={precipitation}
                onChangeText={setPrecipitation}
                placeholder="Enter precipitation intensity"
                helperText="Based on local rainfall data"
                errorText={errors.precipitation}
                inputProps={{
                  keyboardType: 'numeric',
                }}
              />
            </View>
          )}
          
          {/* Advanced Options - Transport & Debris Assessment */}
          <View style={styles.collapsibleSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowTransportSection(!showTransportSection)}
            >
              <Text style={styles.collapsibleTitle}>Transportability & Debris Assessment</Text>
              <Text style={styles.collapsibleIcon}>{showTransportSection ? '▼' : '►'}</Text>
            </TouchableOpacity>
            
            {showTransportSection && (
              <View style={styles.collapsibleContent}>
                <Text style={styles.helperText}>
                  Evaluate stream characteristics to determine if culvert size adjustments are needed for debris and sediment.
                </Text>
                
                <Text style={styles.inputLabel}>Debris Rating:</Text>
                <View style={styles.ratingButtonsContainer}>
                  <RatingButton 
                    label="Low" 
                    value="low" 
                    selected={debrisRating === 'low'} 
                  />
                  <RatingButton 
                    label="Medium" 
                    value="medium" 
                    selected={debrisRating === 'medium'} 
                  />
                  <RatingButton 
                    label="High" 
                    value="high" 
                    selected={debrisRating === 'high'} 
                  />
                </View>
                
                <FieldInput
                  label="Max Sediment Wedge Depth (cm)"
                  value={sedimentDepth}
                  onChangeText={setSedimentDepth}
                  placeholder="Enter sediment depth"
                  helperText="Maximum expected sediment buildup"
                  errorText={errors.sedimentDepth}
                  inputProps={{
                    keyboardType: 'numeric',
                  }}
                />
                
                <FieldInput
                  label="Max Log Diameter (m)"
                  value={logDiameter}
                  onChangeText={setLogDiameter}
                  placeholder="Enter log diameter"
                  helperText="Largest woody debris expected"
                  errorText={errors.logDiameter}
                  inputProps={{
                    keyboardType: 'numeric',
                  }}
                />
              </View>
            )}
          </View>
          
          {/* Advanced Options - Climate Change Projection */}
          <View style={styles.collapsibleSection}>
            <TouchableOpacity 
              style={styles.collapsibleHeader}
              onPress={() => setShowClimateSection(!showClimateSection)}
            >
              <Text style={styles.collapsibleTitle}>Climate Change Projection</Text>
              <Text style={styles.collapsibleIcon}>{showClimateSection ? '▼' : '►'}</Text>
            </TouchableOpacity>
            
            {showClimateSection && (
              <View style={styles.collapsibleContent}>
                <Text style={styles.helperText}>
                  Apply climate change factors to account for projected future precipitation increases.
                </Text>
                
                <Text style={styles.inputLabel}>Projection Scenario:</Text>
                <View style={styles.scenarioContainer}>
                  <ScenarioButton 
                    label="None" 
                    value="none" 
                    selected={climateScenario === 'none'} 
                  />
                  <ScenarioButton 
                    label="2050s (+10%)" 
                    value="2050s" 
                    selected={climateScenario === '2050s'} 
                  />
                  <ScenarioButton 
                    label="2080s (+20%)" 
                    value="2080s" 
                    selected={climateScenario === '2080s'} 
                  />
                  <ScenarioButton 
                    label="Custom" 
                    value="custom" 
                    selected={climateScenario === 'custom'} 
                  />
                </View>
                
                {climateScenario === 'custom' && (
                  <FieldInput
                    label="Custom Climate Factor"
                    value={customClimateFactor}
                    onChangeText={setCustomClimateFactor}
                    placeholder="Enter factor (e.g., 1.15)"
                    helperText="Must be 1.0 or greater (1.15 = +15%)"
                    errorText={errors.customClimateFactor}
                    inputProps={{
                      keyboardType: 'numeric',
                    }}
                  />
                )}
              </View>
            )}
          </View>
          
          {/* Submit Button */}
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={handleSubmit}
          >
            <Text style={styles.calculateButtonText}>Calculate Culvert Size</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  historyButton: {
    backgroundColor: COLORS.accent + '20', // 20% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  historyButtonText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  section: {
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
  collapsibleSection: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    overflow: 'hidden',
  },
  collapsibleHeader: {
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collapsibleTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  collapsibleIcon: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
  },
  collapsibleContent: {
    padding: SPACING.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: COLORS.border + '50', // 50% opacity
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  gpsButton: {
    backgroundColor: COLORS.accent,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  gpsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gpsInfo: {
    backgroundColor: COLORS.primaryLight + '20', // 20% opacity
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  gpsText: {
    fontSize: FONT_SIZE.md,
  },
  gpsAccuracy: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  switchLabel: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    flex: 1,
    paddingRight: SPACING.sm,
  },
  measurementLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  measurementInput: {
    flex: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.error + '20',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    marginTop: 20, // Align with input field
  },
  removeButtonText: {
    fontSize: FONT_SIZE.xl,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.sm,
    alignItems: 'center',
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  addButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
  },
  spaceTop: {
    marginTop: SPACING.md,
  },
  inputLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ratingButtonsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  ratingButton: {
    flex: 1,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
    borderRadius: SCREEN.borderRadius,
    alignItems: 'center',
  },
  ratingButtonSelected: {
    backgroundColor: COLORS.accent + '20',
    borderColor: COLORS.accent,
  },
  ratingButtonText: {
    color: COLORS.textSecondary,
  },
  ratingButtonTextSelected: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  scenarioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  scenarioButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
    marginBottom: SPACING.xs,
    borderRadius: SCREEN.borderRadius,
  },
  scenarioButtonSelected: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  scenarioButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZE.sm,
  },
  scenarioButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
});

export default InputScreen;
