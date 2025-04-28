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
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

// Import components and utilities
import FieldInput from '../../../components/forms/FieldInput';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../../constants/constants';
import { calculateCulvertDiameter } from '../../../utils/calculations/culvertCalculator';
import { saveFieldCard } from '../../../utils/storage/fieldCardStorage';

/**
 * Culvert Tool Input Screen
 * Form for entering watershed and stream measurements
 */
const InputScreen = ({ navigation }) => {
  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    watershedArea: '',
    channelSlope: '',
    streamWidth: '',
    streamDepth: '',
    precipitation: '50', // Default value (mm/hr)
  });

  // Additional state
  const [useClimateProjection, setUseClimateProjection] = useState(false);
  const [climateProjectionFactor, setClimateProjectionFactor] = useState('1.2');
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [errors, setErrors] = useState({});

  // Update form field
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

  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['projectName', 'watershedArea', 'channelSlope', 'streamWidth', 'streamDepth'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
      }
    });
    
    // Validate numeric fields
    const numericFields = ['watershedArea', 'channelSlope', 'streamWidth', 'streamDepth', 'precipitation'];
    numericFields.forEach(field => {
      if (formData[field] && isNaN(parseFloat(formData[field]))) {
        newErrors[field] = 'Must be a valid number';
      }
    });
    
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
      // Scroll to the first error (would need a ref implementation)
      Alert.alert('Validation Error', 'Please check and correct the form errors.');
      return;
    }
    
    try {
      // Parse numeric values
      const watershedArea = parseFloat(formData.watershedArea);
      const precipitation = parseFloat(formData.precipitation);
      const climateFactor = useClimateProjection ? parseFloat(climateProjectionFactor) : 1.0;
      
      // Calculate culvert size
      const culvertDiameter = calculateCulvertDiameter(watershedArea, precipitation, climateFactor);
      
      // Save field card data (could move to the results screen)
      const fieldCard = {
        ...formData,
        climateProjectionUsed: useClimateProjection,
        climateProjectionFactor: useClimateProjection ? parseFloat(climateProjectionFactor) : 1.0,
        calculatedDiameter: culvertDiameter,
        gpsCoordinates: gpsCoordinates,
        dateCreated: new Date().toISOString(),
      };
      
      // Navigate to results screen with data
      navigation.navigate('Result', { 
        fieldCard,
        culvertDiameter,
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
              Enter watershed and stream measurements to calculate the recommended culvert size.
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
            <Text style={styles.sectionTitle}>Project Information</Text>
            
            <FieldInput
              label="Project Name"
              value={formData.projectName}
              onChangeText={(value) => handleChange('projectName', value)}
              placeholder="Enter project name"
              errorText={errors.projectName}
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
          
          {/* Watershed Measurements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Watershed Measurements</Text>
            
            <FieldInput
              label="Watershed Area (km²)"
              value={formData.watershedArea}
              onChangeText={(value) => handleChange('watershedArea', value)}
              placeholder="Enter watershed area"
              errorText={errors.watershedArea}
              inputProps={{
                keyboardType: 'numeric',
              }}
            />
            
            <FieldInput
              label="Channel Slope (%)"
              value={formData.channelSlope}
              onChangeText={(value) => handleChange('channelSlope', value)}
              placeholder="Enter channel slope"
              helperText="Example: 2.5 for 2.5% slope"
              errorText={errors.channelSlope}
              inputProps={{
                keyboardType: 'numeric',
              }}
            />
          </View>
          
          {/* Stream Measurements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Stream Measurements</Text>
            
            <FieldInput
              label="Stream Width (m)"
              value={formData.streamWidth}
              onChangeText={(value) => handleChange('streamWidth', value)}
              placeholder="Enter average stream width"
              errorText={errors.streamWidth}
              inputProps={{
                keyboardType: 'numeric',
              }}
            />
            
            <FieldInput
              label="Stream Depth (m)"
              value={formData.streamDepth}
              onChangeText={(value) => handleChange('streamDepth', value)}
              placeholder="Enter average stream depth"
              errorText={errors.streamDepth}
              inputProps={{
                keyboardType: 'numeric',
              }}
            />
            
            <FieldInput
              label="Precipitation Intensity (mm/hr)"
              value={formData.precipitation}
              onChangeText={(value) => handleChange('precipitation', value)}
              placeholder="Enter precipitation intensity"
              helperText="Based on local rainfall data"
              errorText={errors.precipitation}
              inputProps={{
                keyboardType: 'numeric',
              }}
            />
          </View>
          
          {/* Climate Projection */}
          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Apply Climate Change Projection</Text>
              <Switch
                trackColor={{ false: '#767577', true: COLORS.primaryLight }}
                thumbColor={useClimateProjection ? COLORS.primary : '#f4f3f4'}
                onValueChange={() => setUseClimateProjection(!useClimateProjection)}
                value={useClimateProjection}
              />
            </View>
            
            {useClimateProjection && (
              <FieldInput
                label="Climate Projection Factor"
                value={climateProjectionFactor}
                onChangeText={setClimateProjectionFactor}
                placeholder="Enter factor (e.g., 1.2)"
                helperText="Multiplier for future precipitation increases"
                inputProps={{
                  keyboardType: 'numeric',
                }}
              />
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
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    color: COLORS.primary,
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
