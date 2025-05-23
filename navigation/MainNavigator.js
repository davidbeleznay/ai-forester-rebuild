import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from '../screens/home/HomeScreen';
import CulvertCalculator from '../screens/tools/CulvertCalculator';
import PhotoGalleryScreen from '../screens/PhotoGalleryScreen';
import FormConfigScreen from '../screens/forms/FormConfigScreen';
// Direct import from the main file to ensure proper resolution
import SavedFormsScreen from '../screens/forms/SavedFormsScreen';

// Import components
import FloatingCaptureButton from '../components/FloatingCaptureButton';

// Create navigation stack
const Stack = createNativeStackNavigator();

/**
 * Main app navigation container
 * Contains routes to all main app screens and tool navigators
 * Includes FloatingCaptureButton for quick photo access throughout the app
 */
const MainNavigator = () => {
  return (
    <NavigationContainer>
      <View style={{ flex: 1 }}>
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
            component={CulvertCalculator}
            options={{ title: 'Culvert Sizing Tool' }}
          />
          <Stack.Screen
            name="PhotoGallery"
            component={PhotoGalleryScreen}
            options={{ title: 'Field Photos' }}
          />
          <Stack.Screen
            name="FormConfig"
            component={FormConfigScreen}
            options={{ title: 'Form Configuration' }}
          />
          <Stack.Screen
            name="SavedForms"
            component={SavedFormsScreen}
            options={{ title: 'Saved Assessments' }}
          />
        </Stack.Navigator>
        
        {/* Add FloatingCaptureButton inside the navigation container */}
        <FloatingCaptureButton />
      </View>
    </NavigationContainer>
  );
};

export default MainNavigator;