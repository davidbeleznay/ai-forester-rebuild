/**
 * Application Constants
 * Centralized configuration values for styles, colors, and app behavior
 */

// Color palette 
export const COLORS = {
  // Primary brand colors
  primary: '#2E7D32', // Forest green (main brand color)
  primaryDark: '#1B5E20', // Darker green for highlights
  primaryLight: '#4CAF50', // Lighter green for accents
  
  // Secondary colors
  secondary: '#1565C0', // Blue for secondary actions
  secondaryDark: '#0D47A1',
  secondaryLight: '#1E88E5',
  
  // Alert colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // UI colors
  background: '#F5F5F5', // Light gray background 
  card: '#FFFFFF', // White for cards
  cardIconBg: '#E8F5E9', // Very light green for icon backgrounds
  divider: '#E0E0E0', // Light gray for dividers
  
  // Text colors
  text: '#333333', // Dark gray for main text
  textSecondary: '#757575', // Medium gray for secondary text
  textLight: '#EEEEEE', // Light gray for text on dark backgrounds
  textDisabled: '#9E9E9E', // Disabled text color
  
  // Status colors
  online: '#4CAF50',
  offline: '#F44336',
  
  // Transparent colors
  transparentBackground: 'rgba(0,0,0,0.6)',
  transparentLight: 'rgba(255,255,255,0.8)',
};

// Spacing scale (in pixels)
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Font sizes (in pixels)
export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
};

// Screen properties
export const SCREEN = {
  borderRadius: 8,
  cardElevation: 2,
  headerHeight: 56,
  tabBarHeight: 60,
};

// Animation timing
export const ANIMATION = {
  short: 200,
  medium: 400,
  long: 700,
};

// Form validation
export const VALIDATION = {
  patterns: {
    email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  },
  messages: {
    required: 'This field is required',
    email: 'Enter a valid email address',
    number: 'Enter a valid number',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  formData: '@field_data',
  formDefinitions: '@form_definitions',
  tempImages: '@temp_images',
  lastSyncTime: '@last_sync_time',
  pendingSync: '@pending_sync',
};

// Commercial culvert sizes (in mm)
export const CULVERT_SIZES = [
  300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1600, 1800, 1900, 2000
];

// Constants for culvert calculation
export const CULVERT_CONSTANTS = {
  maxCulvertSize: 2000, // Maximum size in mm before professional engineering is recommended
  runoffCoefficient: 0.45, // Default runoff coefficient for area-based method
  climateFactor: 1.2, // Default climate change factor
};

export default {
  COLORS,
  SPACING,
  FONT_SIZE,
  SCREEN,
  ANIMATION,
  VALIDATION,
  STORAGE_KEYS,
  CULVERT_SIZES,
  CULVERT_CONSTANTS,
};