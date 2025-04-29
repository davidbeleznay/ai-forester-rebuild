import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './navigation/MainNavigator';
import { NetworkProvider } from './utils/NetworkContext';
import NetworkStatusBar from './components/NetworkStatusBar';
import SyncQueueManager from './utils/SyncQueueManager';
import { COLORS } from './constants/constants';

/**
 * Main App Component
 * Entry point for the AI Forester Field Companion App
 */
export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);

  // Initialize app systems on start
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize sync queue
        await SyncQueueManager.init();
        
        // Short delay to ensure all systems are ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsInitializing(false);
      } catch (error) {
        console.error('Error initializing app:', error);
        setInitError(error.message);
        setIsInitializing(false);
      }
    };
    
    initializeApp();
  }, []);
  
  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: COLORS.text }}>Initializing App...</Text>
      </View>
    );
  }
  
  // Show error screen if initialization failed
  if (initError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 }}>
        <Text style={{ color: COLORS.error, fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Initialization Error
        </Text>
        <Text style={{ color: COLORS.text, textAlign: 'center', marginBottom: 20 }}>
          {initError}
        </Text>
        <Text style={{ color: COLORS.textSecondary, textAlign: 'center' }}>
          Please restart the app. If the problem persists, try clearing app data or reinstalling.
        </Text>
      </View>
    );
  }
  
  // Render the app with proper navigation structure
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <NetworkStatusBar />
        <MainNavigator />
      </NetworkProvider>
    </SafeAreaProvider>
  );
}