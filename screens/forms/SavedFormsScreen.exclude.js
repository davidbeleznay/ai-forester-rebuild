// NOTE: This file is intentionally excluded from bundling (renamed with .exclude.js extension)
// It exists only as a reference and is not used in the application
// The active version is SavedFormsScreen2.js

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
// This import causes bundling errors, which is why this file is excluded
// import PDFGenerator from '../../utils/PDFGenerator';

/**
 * SavedFormsScreen Component
 * DEPRECATED: This file is kept for reference only.
 * Use SavedFormsScreen2.js for active development.
 */
const SavedFormsScreen = ({ navigation }) => {
  // Implementation excluded to prevent bundling errors
  return (
    <View>
      <Text>This file is deprecated</Text>
    </View>
  );
};

export default SavedFormsScreen;