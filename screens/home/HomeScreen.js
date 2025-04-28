import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS, SPACING, FONT_SIZE } from '../../constants/constants';

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
    },
    // More tools will be added here in the future
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Forester Field Companion</Text>
          <Text style={styles.subtitle}>Select a field tool to begin</Text>
        </View>

        <View style={styles.toolsContainer}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => navigation.navigate(tool.screen)}
            >
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDescription}>{tool.description}</Text>
            </TouchableOpacity>
          ))}
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
  },
  subtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  toolsContainer: {
    gap: SPACING.md,
  },
  toolCard: {
    backgroundColor: COLORS.card,
    borderRadius: SCREEN.borderRadius,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  toolTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  toolDescription: {
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
  },
});

export default HomeScreen;
