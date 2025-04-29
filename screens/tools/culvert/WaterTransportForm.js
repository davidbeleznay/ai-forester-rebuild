import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../constants/constants';
import { useNetwork } from '../../../utils/NetworkContext';
import DynamicForm from '../../../components/DynamicForm';

/**
 * Water Transport Potential Form Screen
 * Assesses the risk of sediment and debris transport in culverts
 */
const WaterTransportForm = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const { isConnected } = useNetwork();

  // Handle form submission
  const handleSubmit = (values) => {
    try {
      setLoading(true);

      // Calculate transport potential score
      let score = 0;
      
      // Score based on bankfull width
      if (values.bankfullWidth === 'low') {
        score += 1;
      } else if (values.bankfullWidth === 'medium') {
        score += 2;
      } else if (values.bankfullWidth === 'high') {
        score += 3;
      }
      
      // Score based on sediment storage
      if (values.sedimentStorage === 'low') {
        score += 1;
      } else if (values.sedimentStorage === 'medium') {
        score += 2;
      } else if (values.sedimentStorage === 'high') {
        score += 3;
      }
      
      // Score based on woody debris
      if (values.woodyDebris === 'none') {
        score += 0;
      } else if (values.woodyDebris === 'small') {
        score += 1;
      } else if (values.woodyDebris === 'large') {
        score += 2;
      } else if (values.woodyDebris === 'logs') {
        score += 3;
      }
      
      // Determine risk category
      let riskCategory = '';
      let additionalSizing = 0;
      let recommendations = [];
      
      if (score <= 3) {
        riskCategory = 'Low';
        additionalSizing = 0;
        recommendations = [
          'Standard culvert installation is suitable',
          'Regular maintenance schedule recommended'
        ];
      } else if (score <= 6) {
        riskCategory = 'Medium';
        additionalSizing = 0.2; // 20% additional sizing
        recommendations = [
          'Consider beveled inlet for improved flow',
          'Install energy dissipators at outlet',
          'Schedule semi-annual inspections',
          'Size culvert 20% larger than hydraulic requirements'
        ];
      } else {
        riskCategory = 'High';
        additionalSizing = 0.5; // 50% additional sizing
        recommendations = [
          'Size culvert at least 50% larger than hydraulic requirements',
          'Use mitered inlet with headwall',
          'Install outlet apron and energy dissipators',
          'Consider debris rack upstream',
          'Implement quarterly inspection and maintenance',
          'Professional engineering review recommended'
        ];
      }
      
      // Create assessment record
      const assessmentData = {
        bankfullWidth: values.bankfullWidth,
        sedimentStorage: values.sedimentStorage,
        woodyDebris: values.woodyDebris,
        score,
        riskCategory,
        additionalSizing,
        recommendations
      };

      // Show results in a dialog
      Alert.alert(
        'Water Transport Assessment',
        `Risk Category: ${riskCategory}\nTransport Score: ${score}/9\nAdditional Sizing Required: ${additionalSizing * 100}%`,
        [
          { 
            text: 'View Details', 
            onPress: () => {
              // Navigate to a detailed results screen
              navigation.navigate('Results', {
                assessmentData,
                isTransportAssessment: true
              });
            } 
          },
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          },
        ]
      );
    } catch (error) {
      console.error('Error processing form:', error);
      Alert.alert('Assessment Error', 'Could not complete the transport assessment. Please try again.');
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
        <Text style={styles.headerTitle}>Water Transport Potential</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.infoBox}>
          <Feather name="info" size={20} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            This assessment evaluates the potential for sediment and woody debris to affect culvert performance. It determines whether additional culvert sizing is needed beyond basic hydraulic requirements.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <DynamicForm
            formType="water_transport"
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={loading}
            submitButtonText="Assess"
          />
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardIconBg,
    borderRadius: 8,
    padding: SPACING.md,
    margin: SPACING.md,
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
});

export default WaterTransportForm;