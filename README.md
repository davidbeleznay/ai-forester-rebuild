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
- **PDF Export**: Generate professional reports with images and comments
- **Climate Adaptation**: Optional climate change projection factors
- **Low Battery Usage**: Optimized for extended field use
- **Photo Documentation**: Capture and annotate field photos directly in the app
- **Quick Photo Capture**: Floating camera button for instant photo access from anywhere
- **Dynamic Forms**: Customizable field forms with validation
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
npx expo start --clear
```
4. Run on a device:
   - Scan the QR code with Expo Go app on your physical device
## Culvert Sizing Methods
The app provides two methods for calculating culvert sizes:
### California Method
The primary calculation approach is the California Method for nonfish streams. This approach:
1. Takes stream measurements (top width and depth) along with an optional bottom width
2. Uses a simplified trapezoidal formula to calculate the cross-sectional area
3. Multiplies by 3 to determine the end opening area needed for the culvert
4. Uses both a lookup table and area-based calculation to determine the recommended size
5. Flags installations that require professional engineering design

### Commercial Culvert Sizes
The app supports the following standard commercial culvert sizes (in mm):
- 300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1600, 1800, 1900, 2000
- Sizes 2000mm or larger automatically receive a professional engineering design recommendation

### Area-Based Method
As a fallback when stream measurements aren't available, the app offers a simplified area-based calculation that:
1. Uses watershed area and precipitation intensity
2. Calculates flow using a runoff coefficient
3. Converts flow to a recommended culvert diameter
4. Rounds up to the nearest standard culvert size
## Water Transport Potential (WTP) Assessment
The app includes a transport and debris assessment feature that evaluates the potential for sediment and woody debris to affect culvert performance:
1. **Input Parameters**:
   - Bankfull width rating (Low: ≤2m, Medium: >2-3.5m, High: >3.5m)
   - Sediment in storage wedges (Low: ≤100mm, Medium: >100-200mm, High: >200mm)
   - Water-transported woody debris (None, Small, Large, Logs)
2. **Transport Index**:
   - Calculates a weighted index based on these parameters
   - Applies additional sizing factors when debris risk is medium or high
   - Provides specific installation recommendations for high-debris situations
3. **Design Recommendations**:
   - Suggests design features like beveled inlets and outlet aprons when appropriate
   - Recommends maintenance approaches for culverts in high-debris environments

## Field Documentation Features
The app provides comprehensive field documentation capabilities:

1. **Field Notes**: 
   - Add detailed site observations and recommendations
   - Notes are stored with assessment data for future reference
   - Supports multiline text for thorough documentation

2. **Photo Documentation**:
   - Capture photos directly within the app using the floating camera button
   - Floating button available throughout the app for quick access
   - Import existing photos from device gallery
   - Add detailed notes to individual photos
   - Central photo gallery for managing all field photos
   - Organize photos with field assessments
   - All photos work completely offline

3. **Enhanced PDF Reports**:
   - Generate professional PDF reports with field data
   - Include site photos with their annotations
   - Customize reports with field notes and observations
   - Share reports directly from the field
   - All report generation works offline

## Offline Functionality
The app is built to work entirely offline, making it ideal for remote field work:

1. **Robust Offline Storage**:
   - All data is stored locally on the device
   - Calculations and tools work without any internet connection
   - Field cards are saved automatically and persistently
   - Secure storage of measurements, notes, and photos

2. **Network Status Awareness**:
   - Real-time monitoring of connection status
   - Clear indication of online/offline state
   - Automatic handling of network transitions
   - Data integrity preserved during connectivity changes

3. **Intelligent Synchronization**:
   - Changes made offline are tracked and queued
   - Automatic synchronization when connection is restored
   - Prioritized sync queue to handle critical data first
   - Detailed sync status and history available

4. **Offline-First Design**:
   - All features work without internet dependency
   - Report generation and sharing fully functional offline
   - Complete field assessments in areas with no connectivity
   - Seamless experience regardless of connection state

5. **Data Management**:
   - Conflict resolution for changes made on multiple devices
   - Queue management for pending synchronizations
   - Retry mechanisms for failed operations
   - Clear visibility into sync status and pending changes

## Dynamic Form System
The app includes a flexible form system that allows for:

1. **Customizable Field Forms**:
   - Modify form field labels and placeholders
   - Adjust the order of fields
   - Toggle whether fields are required
   - Form configuration persists across app sessions

2. **Field Validation**:
   - Built-in validation for required fields
   - Type-specific validation for numeric inputs
   - Custom validation functions for complex requirements
   - Immediate feedback on validation errors

3. **Form Dependencies**:
   - Show/hide fields based on other field values
   - Conditional validation based on form state
   - Support for complex form workflows

4. **Form Configuration UI**:
   - Admin interface for customizing forms
   - No-code approach to form modifications
   - Reset to default configuration option

## Changelog

### [1.7.7] - 2025-04-29
#### Fixed
- Removed expo-camera dependency to fix bundling errors
- Added fallback functionality for photo capture with placeholder images
- Created a camera modal that shows instructions about the missing dependency
- Ensured app can be run and tested without installing additional packages
- Maintained all existing functionality with graceful degradation of camera features

### [1.7.6] - 2025-04-29
#### Fixed
- Fixed syntax error in CulvertCalculator.js that was causing bundling failures
- Completely rebuilt the file structure to ensure proper component hierarchy
- Improved code organization with clear separation of concerns
- Enhanced robustness of the component with proper error handling
- Ensured consistent rendering across both iOS and Android platforms

### [1.7.5] - 2025-04-29
#### Added
- Added Saved Assessments screen for viewing and managing previous calculations
- Added link to Saved Assessments on the home screen
- Added raw diameter calculation display in culvert results

#### Fixed
- Fixed culvert sizing logic to properly select the correct standard size
- Improved visualization in results modal
- Added enhanced debugging information for culvert calculations

### [1.7.4] - 2025-04-29
#### Fixed
- Fixed camera functionality by using string value 'images' instead of enum MediaTypeOptions.Images
- Fixed PDF generation errors by adding proper null checking for toFixed() operations
- Enhanced PDF generator with safe value formatting throughout
- Added error handling for undefined property access in PDFGenerator
- Improved PDF readability by handling edge cases gracefully

### [1.7.3] - 2025-04-29
#### Fixed
- Improved culvert visualization with concentric circles for better size comparison
- Removed redundant Location field from Culvert Calculator (still captures GPS coordinates)
- Fixed camera functionality with proper ImagePicker MediaTypeOptions
- Enhanced PDF generation with better error handling for toFixed() errors
- Integrated photo capture directly into the Culvert Calculator form

### [1.7.2] - 2025-04-29
#### Fixed
- Fixed icon issue by using a valid Feather icon name ("check-circle" instead of "calculator")
- Simplified stream measurements to just top width, depth, and optional bottom width
- Made bottom width optional with automatic calculation (defaults to 50% of top width when not provided)
- Added climate change factor option for both California Method and Area-Based Method
- Fixed AsyncStorage-related error in PDF generation with better error handling
- Streamlined the UI for more intuitive usage

### [1.7.1] - 2025-04-29
#### Added
- Unified Culvert Calculator with original workflow
- Toggle between California and Area-Based methods within the same screen
- Optional climate change factor input
- Optional water transport assessment 
- Results modal with visualization and export options

#### Fixed
- Fixed NetInfo errors by prioritizing direct network connectivity checks
- Fixed camera functionality with correct MediaTypeOptions
- Fixed form loading issues with simplified all-in-one approach

### [1.7.0] - 2025-04-29
#### Added
- Comprehensive culvert sizing tool with multiple calculation methods
- California Method form for stream measurements
- Area-Based Method form with climate change factors
- Water Transport Potential assessment for debris risk evaluation
- Culvert Results screen with visualization and PDF export
- Enhanced network connectivity handling with fallback mechanisms

#### Fixed
- Fixed NetInfo errors by prioritizing direct network connectivity checks
- Fixed camera functionality with correct MediaTypeOptions
- Ensured proper rendering of culvert sizing options and climate factors
- Improved input validation and error handling throughout forms

### [1.6.0] - 2025-04-29
#### Added
- Dynamic form system with customizable fields
- Form Manager utility for handling form definitions
- Form Configuration screen for customizing forms without code
- Improved HomeScreen with administrative section
- Centralized constants file for styling and configuration

#### Fixed
- Enhanced camera functionality with proper permission handling
- Improved error handling for image capture and storage

### [1.5.3] - 2025-04-29
#### Added
- Updated PDF title to "Culvert Assessment Field Report"
- Enhanced camera functionality with proper error handling

#### Fixed
- Fixed camera capture with proper MediaTypeOptions enum values
- Added fallback network detection methods for better reliability
- Implemented direct connection check as alternative to NetInfo

### [1.5.2] - 2025-04-29
#### Fixed
- Resolved navigation issues with FloatingCaptureButton
- Fixed app initialization sequence
- Improved component structure for better stability
- Enhanced error handling during startup

### [1.5.1] - 2025-04-29
#### Added
- New dedicated PDFGenerator utility for more robust PDF handling
- Improved PDF report generation with better error handling
- Enhanced app initialization with loading indicators

#### Fixed
- Completely resolved NetInfo connectivity issues with NetworkManager utility
- Fixed PDF generation and sharing on both iOS and Android
- Ensured culvert sizing visualization works with all new commercial sizes

### [1.5.0] - 2025-04-29
#### Added
- Expanded commercial culvert sizes (700, 900, 1400, 1600, 1900 mm)
- Improved visualization with concentric circles for all standard sizes
- Professional engineering recommendation for culverts 2000mm and larger
- Enhanced culvert calculator with more accurate sizing options

#### Fixed
- Resolved network connectivity error in NetInfo implementation
- Fixed "getCurrentState is not a function" error by using fetch() method
- Improved error handling for network status detection

### [1.4.0] - 2025-04-29
#### Added
- Floating camera button for quick photo capture from anywhere in the app
- Dedicated Photo Gallery screen for viewing and managing all captured photos
- Ability to add notes to photos directly from the floating button
- Improved user experience for photo documentation workflow

### [1.3.2] - 2025-04-29
#### Fixed
- Resolved network connectivity error by improving NetInfo handling
- Fixed "getCurrentState is not a function" error in the NetworkContext
- Enhanced error handling and fallbacks for network detection
- Made the app more resilient to connectivity API changes

### [1.3.1] - 2025-04-29
#### Fixed
- Resolved bundling error related to missing expo-print dependency
- Fixed PDF generation with proper dependency installation
- Added react-native-tab-view dependency for the tabbed interface

### [1.3.0] - 2025-04-29
#### Added
- Enhanced PDF reporting with photo support
  - Capture and annotate site photos
  - Include photos in PDF reports with their descriptions
  - Organize photos within field assessments
  - Tab-based interface for managing comments and photos
  - Improved PDF generation with images and formatting

### [1.2.0] - 2025-04-29
#### Added
- Comprehensive offline capability
  - Robust local storage system for all field data
  - Network status monitoring and management
  - Intelligent synchronization queue for offline changes
  - Offline data manager interface
  - Status indicators for connection and sync state

### [1.1.0] - 2025-04-28
#### Added
- Report export functionality for field data
  - Generate text-based reports from field data
  - Share reports directly with other apps
  - Works completely offline with no internet connection required
- Enhanced comment field in results screen
  - Improved UI for field notes and observations
  - Better visual feedback when entering comments
  - Comments automatically included in exported reports