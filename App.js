import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MainNavigator from './navigation/MainNavigator';
import { NetworkProvider } from './utils/NetworkContext';
import NetworkStatusBar from './components/NetworkStatusBar';
import FloatingCaptureButton from './components/FloatingCaptureButton';
import SyncQueueManager from './utils/SyncQueueManager';

/**
 * Main App Component
 * Entry point for the AI Forester Field Companion App
 */
export default function App() {
  // Initialize sync queue on app start
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize sync queue
      await SyncQueueManager.init();
    };
    
    initializeApp();
  }, []);
  
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <NetworkStatusBar />
        <MainNavigator />
        <FloatingCaptureButton />
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
