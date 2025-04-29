// Application theme and styling constants

// Colors
export const COLORS = {
  // Main palette
  primary: '#2E7D32',     // Forest green
  secondary: '#1976D2',   // Blue
  accent: '#FFA000',      // Amber
  background: '#F5F5F5',  // Light grey background
  card: '#FFFFFF',        // White card background
  
  // Text colors
  text: '#212121',        // Near black for primary text
  textSecondary: '#757575', // Grey for secondary text
  
  // Status colors
  success: '#4CAF50',     // Green
  warning: '#FF9800',     // Orange
  error: '#F44336',       // Red
  info: '#2196F3',        // Blue
  
  // Network status
  online: '#4CAF50',      // Green
  offline: '#F44336',     // Red
  
  // Others
  border: '#E0E0E0',      // Light grey border
  divider: '#EEEEEE',     // Very light grey divider
  disabled: '#BDBDBD',    // Grey for disabled elements
  shadow: 'rgba(0, 0, 0, 0.1)', // Shadow color
};

// Spacing
export const SPACING = {
  xs: 4,    // Extra small: 4dp
  sm: 8,    // Small: 8dp
  md: 16,   // Medium: 16dp
  lg: 24,   // Large: 24dp
  xl: 32,   // Extra large: 32dp
  xxl: 48,  // Double extra large: 48dp
};

// Typography
export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.25,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0,
  },
  h3: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.15,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  h5: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  subtitle1: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  subtitle2: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal',
    letterSpacing: 0.25,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1.25,
    textTransform: 'uppercase',
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal',
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    fontWeight: 'normal',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
};

// Shapes and borders
export const SHAPES = {
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 9999,
  },
  borderWidth: {
    thin: 0.5,
    standard: 1,
    thick: 2,
  },
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.0,
    elevation: 3,
  },
  lg: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  xl: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6.65,
    elevation: 9,
  },
};

// Common screen and layout measurements
export const LAYOUT = {
  headerHeight: 56,
  footerHeight: 48,
  sideMargin: 16,
  maxContentWidth: 600,  // For tablet/desktop layouts
};

// Animation durations
export const ANIMATION = {
  short: 200,
  medium: 300,
  long: 500,
};

// Export all together
export default {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHAPES,
  SHADOWS,
  LAYOUT,
  ANIMATION,
};