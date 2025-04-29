import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import culvert tool screens
import CulvertMethodSelect from '../../screens/tools/culvert/CulvertMethodSelect';
import CaliforniaMethodForm from '../../screens/tools/culvert/CaliforniaMethodForm';
import AreaBasedMethodForm from '../../screens/tools/culvert/AreaBasedMethodForm';
import WaterTransportForm from '../../screens/tools/culvert/WaterTransportForm';
import CulvertResultsScreen from '../../screens/tools/culvert/CulvertResultsScreen';

// Create navigator
const Stack = createNativeStackNavigator();

/**
 * Culvert Tool Navigator
 * Provides navigation structure for the culvert sizing tool
 */
const CulvertToolNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MethodSelect"
      screenOptions={{
        headerShown: false, // Hide nested headers
      }}
    >
      <Stack.Screen name="MethodSelect" component={CulvertMethodSelect} />
      <Stack.Screen name="CaliforniaMethod" component={CaliforniaMethodForm} />
      <Stack.Screen name="AreaBasedMethod" component={AreaBasedMethodForm} />
      <Stack.Screen name="WaterTransport" component={WaterTransportForm} />
      <Stack.Screen name="Results" component={CulvertResultsScreen} />
    </Stack.Navigator>
  );
};

export default CulvertToolNavigator;