import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING, CULVERT_CONSTANTS } from '../../../constants/constants';
import { useNetwork } from '../../../utils/NetworkContext';
import DynamicForm from '../../../components/DynamicForm';

/**
 * Area-Based Method Form Screen
 * Collects watershed information for culvert sizing using the Area-Based Method
 */
const AreaBasedMethodForm = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const { isConnected } = useNetwork();

  // Get location when needed
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
          timeout: 15000,
        });

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Could not get current location');
      }
    };

    // Don't automatically request location - wait for user to toggle the switch
  }, []);

  // Handle form submission
  const handleSubmit = (values) => {
    try {
      setLoading(true);

      // Parse input values
      const watershedArea = parseFloat(values.watershedArea);
      const precipitation = parseFloat(values.precipitation);
      const runoffCoefficient = parseFloat(values.runoffCoefficient) || CULVERT_CONSTANTS.runoffCoefficient;
      
      // Apply climate change factor if enabled
      let climateFactor = 1.0;
      if (values.climateFactorEnabled) {
        climateFactor = parseFloat(values.climateFactor) || CULVERT_CONSTANTS.climateFactor;
      }

      // Calculate flow using the rational method (Q = CIA)
      // C = runoff coefficient
      // I = rainfall intensity (mm/hr)
      // A = area (km²)
      // Factor of 0.00278 converts units to m³/s
      const baseFlow = runoffCoefficient * precipitation * watershedArea * 0.00278;
      
      // Apply climate factor
      const flowCapacity = baseFlow * climateFactor;
      
      // Calculate culvert area based on flow (simplified version)
      // Assume flow velocity of 1.5 m/s
      const culvertArea = flowCapacity / 1.5;

      // Include GPS coordinates if requested
      const gpsCoordinates = values.useGps && location ? location : null;

      // Include non-calculated form values in fieldCard
      const fieldCard = {
        streamId: values.streamId,
        location: values.location,
        gpsCoordinates,
        watershedArea,
        precipitation,
        runoffCoefficient,
        climateFactorEnabled: values.climateFactorEnabled,
        climateFactor: values.climateFactorEnabled ? climateFactor : null,
        comments: values.comments || '',
      };

      // Navigate to results screen with calculated data
      navigation.navigate('Results', {
        fieldCard,
        culvertArea,
        flowCapacity,
        calculationMethod: 'area-based',
      });
    } catch (error) {
      console.error('Error processing form:', error);
      Alert.alert('Calculation Error', 'Could not process watershed data. Please check your input values.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigation.goBack();
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
        <Text style={styles.headerTitle}>Area-Based Method</Text>
      </View>

      <View style={styles.formContainer}>
        <DynamicForm
          formType="culvert_area_based"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={loading}
          submitButtonText="Calculate"
        />
      </View>
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
  formContainer: {
    flex: 1,
  },
});

export default AreaBasedMethodForm;