import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Share
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { COLORS, SPACING } from '../../constants/constants';

/**
 * This screen has been deprecated and replaced by SavedFormsScreen2
 * This version exists for backward compatibility and to prevent bundling errors
 * The app now uses SavedFormsScreen2 by default
 */
const SavedFormsScreen = ({ navigation }) => {
  // Redirect to the new screen implementation
  useEffect(() => {
    // Intentionally left empty - this component exists just to prevent bundling errors
    // The MainNavigator already points to SavedFormsScreen2
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading saved assessments...</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  }
});

export default SavedFormsScreen;