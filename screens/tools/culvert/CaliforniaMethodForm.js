import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, SPACING } from '../../../constants/constants';
import { useNetwork } from '../../../utils/NetworkContext';
import DynamicForm from '../../../components/DynamicForm';

/**
 * California Method Form Screen
 * Collects stream measurements for culvert sizing using the California Method
 */
const CaliforniaMethodForm = ({ navigation }) => {
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

      // Calculate average top width
      const topWidth1 = parseFloat(values.topWidth1);
      const topWidth2 = parseFloat(values.topWidth2);
      const topWidth3 = parseFloat(values.topWidth3);
      const averageTopWidth = (topWidth1 + topWidth2 + topWidth3) / 3;

      // Calculate average depth
      const depth1 = parseFloat(values.depth1);
      const depth2 = parseFloat(values.depth2);
      const depth3 = parseFloat(values.depth3);
      const averageDepth = (depth1 + depth2 + depth3) / 3;

      // Calculate cross-sectional area using trapezoidal formula
      const bottomWidth = parseFloat(values.bottomWidth);
      const crossSectionalArea = ((averageTopWidth + bottomWidth) / 2) * averageDepth;

      // Multiply by 3 to get culvert cross-sectional area as per California Method
      const culvertArea = crossSectionalArea * 3;

      // Minimum flow capacity based on cross-sectional area (approximate)
      const flowCapacity = culvertArea * 1.5; // simplified flow calculation

      // Include GPS coordinates if requested
      const gpsCoordinates = values.useGps && location ? location : null;

      // Include non-calculated form values in fieldCard
      const fieldCard = {
        streamId: values.streamId,
        location: values.location,
        gpsCoordinates,
        topWidth1,
        topWidth2,
        topWidth3,
        depth1,
        depth2,
        depth3,
        bottomWidth,
        averageTopWidth,
        averageDepth,
        crossSectionalArea,
        comments: values.comments || '',
      };

      // Navigate to results screen with calculated data
      navigation.navigate('Results', {
        fieldCard,
        culvertArea,
        flowCapacity,
        calculationMethod: 'california',
      });
    } catch (error) {
      console.error('Error processing form:', error);
      Alert.alert('Calculation Error', 'Could not process stream measurements. Please check your input values.');
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
        <Text style={styles.headerTitle}>California Method</Text>
      </View>

      <View style={styles.formContainer}>
        <DynamicForm
          formType="culvert_california"
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

export default CaliforniaMethodForm;