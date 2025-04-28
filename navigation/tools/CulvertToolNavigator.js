import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens (placeholder imports for now)
const InputScreen = () => <View style={styles.container}><Text>Input Screen</Text></View>;
const ResultScreen = () => <View style={styles.container}><Text>Result Screen</Text></View>;

// Import required components
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/constants';

// Create stack navigator
const Stack = createNativeStackNavigator();

/**
 * Culvert Tool Navigator
 * Contains all screens related to the culvert sizing tool
 */
const CulvertToolNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Input"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Input"
        component={InputScreen}
        options={{ title: 'Enter Measurements' }}
      />
      <Stack.Screen
        name="Result"
        component={ResultScreen}
        options={{ title: 'Culvert Results' }}
      />
    </Stack.Navigator>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default CulvertToolNavigator;
