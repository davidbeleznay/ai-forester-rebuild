import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../../../constants/constants';
import { useNetwork } from '../../../utils/NetworkContext';

/**
 * Culvert Method Selection Screen
 * Allows users to select which culvert sizing method to use
 */
const CulvertMethodSelect = ({ navigation }) => {
  const { isConnected } = useNetwork();

  // Method options 
  const methods = [
    {
      id: 'california',
      title: 'California Method',
      description: 'Calculate culvert size using stream measurements (top widths, depths, and bottom width).',
      icon: 'droplet',
      screen: 'CaliforniaMethod',
      recommended: true
    },
    {
      id: 'area-based',
      title: 'Area-Based Method',
      description: 'Calculate culvert size using watershed area and precipitation intensity.',
      icon: 'map',
      screen: 'AreaBasedMethod',
      recommended: false
    },
  ];

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
        <Text style={styles.headerTitle}>Culvert Sizing Tool</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>Select Calculation Method</Text>
          <Text style={styles.subtitle}>
            Choose the appropriate method based on available field data
          </Text>

          {/* Method cards */}
          {methods.map((method) => (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodCard,
                method.recommended && styles.recommendedCard
              ]}
              onPress={() => navigation.navigate(method.screen)}
            >
              {method.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
              
              <View style={styles.methodIconContainer}>
                <Feather name={method.icon} size={28} color={COLORS.primary} />
              </View>
              
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodDescription}>{method.description}</Text>
              </View>
              
              <Feather name="chevron-right" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          ))}

          {/* Visual representation of methods */}
          <View style={styles.visualization}>
            <Text style={styles.visualizationTitle}>Method Comparison</Text>
            
            <View style={styles.visualizationCard}>
              <Text style={styles.visualizationSubtitle}>California Method</Text>
              <Text style={styles.visualizationDescription}>
                Takes stream measurements at 3 points and calculates based on the trapezoidal cross-section.
              </Text>
              <View style={styles.visualizationImage}>
                {/* Simplified visualization of California method */}
                <View style={styles.trapezoid}>
                  <View style={styles.trapezoidLine} />
                  <View style={styles.measurementPoint} />
                  <View style={styles.measurementPoint} />
                  <View style={styles.measurementPoint} />
                  <View style={styles.trapezoidBottom} />
                </View>
              </View>
            </View>
            
            <View style={styles.visualizationCard}>
              <Text style={styles.visualizationSubtitle}>Area-Based Method</Text>
              <Text style={styles.visualizationDescription}>
                Uses watershed area and precipitation to calculate flow and required culvert size.
              </Text>
              <View style={styles.visualizationImage}>
                {/* Simplified visualization of Area-based method */}
                <View style={styles.watershed}>
                  <View style={styles.watershedOutline} />
                  <View style={styles.raindrops}>
                    <View style={styles.raindrop} />
                    <View style={styles.raindrop} />
                    <View style={styles.raindrop} />
                  </View>
                  <View style={styles.culvert} />
                </View>
              </View>
            </View>
          </View>
          
          {/* Additional transport assessment card */}
          <TouchableOpacity
            style={styles.transportCard}
            onPress={() => navigation.navigate('WaterTransport')}
          >
            <View style={styles.transportIconContainer}>
              <Feather name="activity" size={28} color="#fff" />
            </View>
            
            <View style={styles.transportContent}>
              <Text style={styles.transportTitle}>Water Transport Potential</Text>
              <Text style={styles.transportDescription}>
                Assess debris transport risk and get additional design recommendations.
              </Text>
            </View>
            
            <Feather name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  methodCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  recommendedCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    paddingTop: 20,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.cardIconBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  methodDescription: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  visualization: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  visualizationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  visualizationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  visualizationSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  visualizationDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  visualizationImage: {
    height: 120,
    backgroundColor: COLORS.cardIconBg,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trapezoid: {
    width: '80%',
    height: 80,
    position: 'relative',
  },
  trapezoidLine: {
    width: '100%',
    height: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: 0,
  },
  trapezoidBottom: {
    width: '70%',
    height: 2,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
  },
  measurementPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: -5,
  },
  watershed: {
    width: '80%',
    height: 80,
    position: 'relative',
  },
  watershedOutline: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 20,
  },
  raindrops: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    left: '30%',
  },
  raindrop: {
    width: 6,
    height: 10,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 3,
    marginHorizontal: 5,
  },
  culvert: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
  },
  transportCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  transportIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transportContent: {
    flex: 1,
  },
  transportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  transportDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});

export default CulvertMethodSelect;