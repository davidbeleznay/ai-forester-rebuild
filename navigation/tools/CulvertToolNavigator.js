import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import InputScreen from '../../screens/tools/culvert/InputScreen';
import ResultScreen from '../../screens/tools/culvert/ResultScreen';
import HistoryScreen from '../../screens/tools/culvert/HistoryScreen';

// Import required components
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
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Field Card History' }}
      />
    </Stack.Navigator>
  );
};

export default CulvertToolNavigator;
