# AI Forester Field Companion App

## Project Overview

The AI Forester Field Companion is a mobile application designed for forestry professionals who need to perform field calculations and assessments while working in remote areas. The app is specifically optimized for field use with offline functionality, battery conservation features, and interfaces designed for outdoor visibility.

Built with React Native and Expo, this app leverages AI capabilities to enhance traditional forestry calculations and provides a suite of field tools that help professionals make data-driven decisions directly from the field.

## Key Features

- **Offline Functionality**: All calculations and tools work without internet connection
- **Field Data Collection**: Capture and store field measurements efficiently
- **Culvert Sizing Tool**: Calculate proper culvert sizes based on watershed characteristics
- **Cross-platform**: Works on both iOS and Android devices
- **GPS Integration**: Capture location data for field cards
- **PDF Export**: Generate professional reports for documentation
- **Climate Adaptation**: Optional climate change projection factors
- **Low Battery Usage**: Optimized for extended field use

## Getting Started

### Prerequisites

- Node.js (v16+)
- Expo CLI
- Expo Go app on your mobile device
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/davidbeleznay/ai-forester-rebuild.git
cd ai-forester-rebuild
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on a device:
   - Scan the QR code with Expo Go app on your physical device

## Culvert Sizing Methods

The app provides two methods for calculating culvert sizes:

### California Method

The primary calculation approach is the California Method for nonfish streams. This approach:

1. Takes multiple stream measurements (top widths and depths) along with a bottom width
2. Calculates the average top width and depth
3. Computes the cross-sectional area using the trapezoidal formula
4. Multiplies by 3 to determine the end opening area needed for the culvert
5. Uses both a lookup table and area-based calculation to determine the recommended size
6. Flags installations that require professional engineering design

### Area-Based Method

As a fallback when stream measurements aren't available, the app offers a simplified area-based calculation that:

1. Uses watershed area and precipitation intensity
2. Calculates flow using a runoff coefficient
3. Converts flow to a recommended culvert diameter
4. Rounds up to the nearest standard culvert size

## Transport & Debris Assessment

The app includes a transport and debris assessment feature that evaluates the potential for sediment and woody debris to affect culvert performance:

1. **Input Parameters**:
   - Debris rating (Low, Medium, High)
   - Maximum sediment wedge depth (cm)
   - Maximum log diameter (m)

2. **Transport Index**:
   - Calculates a weighted index based on these parameters
   - Applies additional sizing factors when debris risk is medium or high
   - Provides specific installation recommendations for high-debris situations

3. **Design Recommendations**:
   - Suggests design features like beveled inlets and outlet aprons when appropriate
   - Recommends maintenance approaches for culverts at risk of debris blockage

4. **Water Transport Potential (WTP) Guidelines**:
   - WTP assessments are not simple averages of parameters
   - A single critical risk factor (like an active landslide) dominates the overall risk assessment
   - Even if most factors indicate stability, a single high-instability feature can mobilize major sediment
   - Users should err on the side of the highest rating when making final decisions

## Climate Change Projection

The app provides climate change projection options to future-proof culvert sizing:

1. **Projection Scenarios**:
   - 2050s (RCP4.5): +10% uplift on flow calculations
   - 2080s (RCP4.5): +20% uplift on flow calculations
   - Custom: User-defined uplift factor

2. **Implementation**:
   - Applies the selected factor to increase the calculated culvert size
   - Shows before/after size comparison for transparency
   - Allows users to prepare infrastructure for changing precipitation patterns

## Project Structure

```
ai-forester-rebuild/
├── App.js                   # Main application entry point
├── app.json                 # Expo configuration
├── assets/                  # Images, fonts, and other static assets
├── components/              # Reusable UI components
│   ├── common/              # Shared UI elements
│   └── forms/               # Form-related components
├── constants/               # App-wide constants and configuration
├── navigation/              # Navigation configuration
├── screens/                 # Screen components
│   ├── home/                # Home screen
│   └── tools/               # Tool-specific screens
│       └── culvert/         # Culvert tool screens
├── utils/                   # Utility functions
│   ├── calculations/        # Calculation logic
│   ├── storage/             # Local storage functions
│   └── formatting/          # Data formatting utilities
└── package.json             # Dependencies and scripts
```

## Adding Custom Icons

To replace the placeholder icons with your own custom icons:

1. Prepare your icon images in the following formats:
   - `icon.png`: 1024x1024 pixels (main app icon)
   - `splash.png`: 2048x2048 pixels (splash screen)
   - `adaptive-icon.png`: 1024x1024 pixels (Android adaptive icon)
   - `favicon.png`: 48x48 pixels (web favicon)

2. Place your custom icons in the `assets/` directory, replacing the existing placeholder files.

3. Rebuild the app with `npx expo start` to apply the new icons.

## Changelog

### 2025-04-28 (v1.5)
- **Enhanced Visualization and Transport Assessment**:
  - Implemented concentric circle visualization for culvert sizes from 600mm to 2000mm
  - Added bridge recommendation symbol for culverts larger than 2000mm
  - Created interactive size legend with highlighting for the recommended size
  - Added toggle switches for Transport and Climate Change information sections
  - Improved Transport Assessment with detailed WTP guidelines and critical risk indicators
  - Enhanced navigation with consistent UI elements across screens
  - Optimized visualization layout for better usability on smaller screens
  - Improved UI feedback for size comparisons with color coordination

### 2025-04-28 (v1.4)
- **Added Transport & Debris Assessment and Climate Change Projections**:
  - Implemented Transport Index calculation with debris rating, sediment depth, and log diameter
  - Added design recommendations for culverts in high-debris environments
  - Created collapsible advanced option sections in the UI
  - Implemented climate change projection with 2050s/2080s scenarios
  - Added size adjustment visualization to show progression of sizing calculations
  - Enhanced results screen with comprehensive sizing breakdown
  - Updated calculation logic to handle both assessment methods
  - Added detailed recommendations in the results screen

### 2025-04-28 (v1.3)
- **Implemented California Method for culvert sizing**:
  - Added comprehensive California Method lookup table
  - Implemented stream measurement-based calculation with multiple inputs
  - Created new InputScreen UI with multiple measurement fields
  - Updated ResultScreen to display calculation details
  - Added professional design recommendation when required
  - Implemented area-based fallback method
  - Enhanced HistoryScreen to show calculation method used
  - Added visualization enhancements for better understanding

### 2025-04-28 (v1.2)
- **Implemented complete Culvert Tool functionality**:
  - Created input form with watershed measurements and GPS capture
  - Added results screen with culvert visualization and assessment
  - Implemented history screen for field card management
  - Added data sharing and climate projection options
  - Fixed placeholder assets and enabled new architecture
  - Updated documentation with icon instructions

### 2025-04-28 (v1.1)
- **Built foundational components and utilities**:
  - Added culvertCalculator.js with sizing formulas and hydraulic calculations
  - Created fieldCardStorage.js for local data persistence with AsyncStorage
  - Implemented FieldInput.js as a reusable form component
  - Set up proper constants and styling configuration

### 2025-04-28 (v1.0)
- **Initial project setup**:
  - Created fresh repository with modular structure
  - Set up basic Expo project configuration
  - Implemented core app navigation structure
  - Added HomeScreen with navigation to Culvert Tool
  - Created placeholder for CulvertToolNavigator
  - Established project documentation
