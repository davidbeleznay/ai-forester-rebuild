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

## Report Generation and Field Documentation
The app provides comprehensive field documentation capabilities:

1. **Field Notes**: 
   - Add detailed site observations and recommendations
   - Notes are stored with assessment data for future reference
   - Supports multiline text for thorough documentation

2. **Report Generation**:
   - Export professional text-based reports with all field data
   - Reports include site information, measurements, and calculations
   - All field notes and comments are included in the exported reports
   - Completely functional offline with no internet connection required

3. **Field Photos**:
   - Capture photos directly within the app
   - Import existing photos from device gallery
   - Images are stored with the assessment data
   - Photos can be included in reports for comprehensive documentation

## Offline Functionality
All app features are designed to work completely offline:

1. **Data Storage**:
   - All measurements and calculations are stored locally
   - Assessment history is available without internet connection
   - Field cards sync when connection becomes available

2. **Report Generation**:
   - Export and share reports without internet connectivity
   - All documentation features work in remote field locations

## Changelog

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
