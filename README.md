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

## Changelog

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
