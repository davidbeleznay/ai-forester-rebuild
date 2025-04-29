import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../constants/constants';

/**
 * HomeScreen Component
 * Main landing screen with navigation to all available tools
 */
const HomeScreen = ({ navigation }) => {
  // Tool options with descriptions
  const tools = [
    {
      id: 'culvert',
      title: 'Culvert Sizing Tool',
      description: 'Calculate proper culvert sizes based on watershed characteristics and stream measurements.',
      screen: 'CulvertTool',
      icon: 'droplet',
    },
    // More tools will be added here in the future
  ];

  // Administrative options
  const adminOptions = [
    {
      id: 'savedForms',
      title: 'Saved Assessments',
      description: 'View, manage, and export saved field assessments and calculations.',
      screen: 'SavedForms',
      icon: 'clipboard',
    },
    {
      id: 'formConfig',
      title: 'Form Configuration',
      description: 'Customize field forms by modifying labels, required fields, and field order.',
      screen: 'FormConfig',
      icon: 'edit-3',
      params: { formType: 'culvert_california' }
    },
    {
      id: 'photoGallery',
      title: 'Photo Gallery',
      description: 'View and manage photos captured during field assessments.',
      screen: 'PhotoGallery',
      icon: 'image',
    },
  ];

  // Render a card item for tools and admin options
  const renderCard = (item, index) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => navigation.navigate(item.screen, item.params)}
    >
      <View style={styles.cardIconContainer}>
        <Feather name={item.icon} size={24} color={COLORS.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description}</Text>
      </View>
      <Feather name="chevron-right" size={24} color={COLORS.primary} style={styles.cardArrow} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Forester Field Companion</Text>
          <Text style={styles.subtitle}>Field tools for forestry professionals</Text>
        </View>

        {/* Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIELD TOOLS</Text>
          <View style={styles.cardsContainer}>
            {tools.map(renderCard)}
          </View>
        </View>
        
        {/* Administrative Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADMINISTRATIVE</Text>
          <View style={styles.cardsContainer}>
            {adminOptions.map(renderCard)}
          </View>
        </View>
      </ScrollView>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  header: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 1,
  },
  cardsContainer: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardIconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs / 2,
  },
  cardDescription: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.text,
  },
  cardArrow: {
    marginLeft: SPACING.sm,
  },
});

export default HomeScreen;