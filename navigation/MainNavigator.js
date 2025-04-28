import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import CulvertToolNavigator from './tools/CulvertToolNavigator';

// Create navigation stack
const Stack = createNativeStackNavigator();

/**
 * Main app navigation container
 * Contains routes to all main app screens and tool navigators
 */
const MainNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2E7D32', // Forest green
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'AI Forester Field Companion' }}
        />
        <Stack.Screen
          name="CulvertTool"
          component={CulvertToolNavigator}
          options={{ title: 'Culvert Sizing Tool' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;
