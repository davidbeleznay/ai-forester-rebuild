/**
 * Culvert Calculator Utility
 * Functions for calculating culvert sizes based on field measurements
 * using the California Method for Nonfish Streams
 */

/**
 * California Method lookup table for nonfish streams
 * Structure: 
 * - First dimension: Average stream width (meters) in 0.1m increments (0.1 to 5.0)
 * - Second dimension: Average stream depth of bankfull channel in 0.05m increments (0.05 to 0.50)
 * - Values: Recommended culvert sizes in mm, or "Q100" if professional design is required
 */
const CALIFORNIA_METHOD_TABLE = {
  "0.1": {"0.05": 600, "0.10": 600, "0.15": 600, "0.20": 600, "0.25": 600, "0.30": 600, "0.35": 600, "0.40": 600, "0.45": 600, "0.50": 600},
  "0.2": {"0.05": 600, "0.10": 600, "0.15": 600, "0.20": 600, "0.25": 600, "0.30": 600, "0.35": 600, "0.40": 600, "0.45": 600, "0.50": 700},
  "0.3": {"0.05": 600, "0.10": 600, "0.15": 600, "0.20": 600, "0.25": 600, "0.30": 600, "0.35": 700, "0.40": 700, "0.45": 800, "0.50": 800},
  "0.4": {"0.05": 600, "0.10": 600, "0.15": 600, "0.20": 600, "0.25": 700, "0.30": 700, "0.35": 800, "0.40": 800, "0.45": 900, "0.50": 900},
  "0.5": {"0.05": 600, "0.10": 600, "0.15": 600, "0.20": 700, "0.25": 700, "0.30": 800, "0.35": 900, "0.40": 900, "0.45": 1000, "0.50": 1000},
  "0.6": {"0.05": 600, "0.10": 600, "0.15": 700, "0.20": 700, "0.25": 800, "0.30": 900, "0.35": 900, "0.40": 1000, "0.45": 1000, "0.50": 1200},
  "0.7": {"0.05": 600, "0.10": 600, "0.15": 700, "0.20": 800, "0.25": 900, "0.30": 900, "0.35": 1000, "0.40": 1200, "0.45": 1200, "0.50": 1200},
  "0.8": {"0.05": 600, "0.10": 600, "0.15": 700, "0.20": 800, "0.25": 900, "0.30": 900, "0.35": 1200, "0.40": 1200, "0.45": 1200, "0.50": 1400},
  "0.9": {"0.05": 600, "0.10": 600, "0.15": 800, "0.20": 900, "0.25": 1000, "0.30": 1200, "0.35": 1200, "0.40": 1200, "0.45": 1400, "0.50": 1400},
  "1.0": {"0.05": 600, "0.10": 700, "0.15": 800, "0.20": 900, "0.25": 1000, "0.30": 1200, "0.35": 1200, "0.40": 1400, "0.45": 1400, "0.50": 1500},
  "1.1": {"0.05": 600, "0.10": 700, "0.15": 800, "0.20": 1000, "0.25": 1200, "0.30": 1200, "0.35": 1400, "0.40": 1400, "0.45": 1400, "0.50": 1500},
  "1.2": {"0.05": 600, "0.10": 700, "0.15": 900, "0.20": 1000, "0.25": 1200, "0.30": 1200, "0.35": 1400, "0.40": 1400, "0.45": 1500, "0.50": 1600},
  "1.3": {"0.05": 600, "0.10": 800, "0.15": 900, "0.20": 1000, "0.25": 1200, "0.30": 1400, "0.35": 1400, "0.40": 1500, "0.45": 1500, "0.50": 1600},
  "1.4": {"0.05": 600, "0.10": 800, "0.15": 900, "0.20": 1200, "0.25": 1200, "0.30": 1400, "0.35": 1400, "0.40": 1500, "0.45": 1600, "0.50": 1800},
  "1.5": {"0.05": 600, "0.10": 800, "0.15": 1000, "0.20": 1200, "0.25": 1200, "0.30": 1400, "0.35": 1500, "0.40": 1600, "0.45": 1800, "0.50": 1800},
  "1.6": {"0.05": 600, "0.10": 800, "0.15": 1000, "0.20": 1200, "0.25": 1400, "0.30": 1400, "0.35": 1500, "0.40": 1600, "0.45": 1800, "0.50": 1900},
  "1.7": {"0.05": 600, "0.10": 800, "0.15": 1000, "0.20": 1200, "0.25": 1400, "0.30": 1400, "0.35": 1600, "0.40": 1800, "0.45": 1800, "0.50": 1900},
  "1.8": {"0.05": 600, "0.10": 900, "0.15": 1000, "0.20": 1200, "0.25": 1400, "0.30": 1500, "0.35": 1600, "0.40": 1800, "0.45": 1900, "0.50": 1900},
  "1.9": {"0.05": 600, "0.10": 900, "0.15": 1200, "0.20": 1400, "0.25": 1400, "0.30": 1500, "0.35": 1600, "0.40": 1800, "0.45": 1900, "0.50": "Q100"},
  "2.0": {"0.05": 700, "0.10": 900, "0.15": 1200, "0.20": 1400, "0.25": 1400, "0.30": 1600, "0.35": 1800, "0.40": 1800, "0.45": 1900, "0.50": "Q100"},
  "2.1": {"0.05": 700, "0.10": 900, "0.15": 1200, "0.20": 1400, "0.25": 1500, "0.30": 1600, "0.35": 1800, "0.40": 1900, "0.45": "Q100", "0.50": "Q100"},
  "2.2": {"0.05": 700, "0.10": 1000, "0.15": 1200, "0.20": 1400, "0.25": 1500, "0.30": 1600, "0.35": 1800, "0.40": 1900, "0.45": "Q100", "0.50": "Q100"},
  "2.3": {"0.05": 700, "0.10": 1000, "0.15": 1200, "0.20": 1400, "0.25": 1600, "0.30": 1800, "0.35": 1800, "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.4": {"0.05": 700, "0.10": 1000, "0.15": 1200, "0.20": 1400, "0.25": 1600, "0.30": 1800, "0.35": 1900, "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.5": {"0.05": 700, "0.10": 1000, "0.15": 1400, "0.20": 1500, "0.25": 1600, "0.30": 1800, "0.35": 1900, "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.6": {"0.05": 800, "0.10": 1000, "0.15": 1400, "0.20": 1500, "0.25": 1600, "0.30": 1800, "0.35": 1900, "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.7": {"0.05": 800, "0.10": 1000, "0.15": 1400, "0.20": 1500, "0.25": 1600, "0.30": 1800, "0.35": 1900, "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.8": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1500, "0.25": 1800, "0.30": 1900, "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "2.9": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1500, "0.25": 1800, "0.30": 1900, "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.0": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1600, "0.25": 1800, "0.30": 1900, "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.1": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1600, "0.25": 1800, "0.30": 1900, "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.2": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1600, "0.25": 1800, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.3": {"0.05": 800, "0.10": 1200, "0.15": 1400, "0.20": 1600, "0.25": 1800, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.4": {"0.05": 900, "0.10": 1200, "0.15": 1500, "0.20": 1600, "0.25": 1900, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.5": {"0.05": 900, "0.10": 1200, "0.15": 1500, "0.20": 1800, "0.25": 1900, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.6": {"0.05": 900, "0.10": 1200, "0.15": 1500, "0.20": 1800, "0.25": 1900, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.7": {"0.05": 900, "0.10": 1200, "0.15": 1500, "0.20": 1800, "0.25": 1900, "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.8": {"0.05": 900, "0.10": 1400, "0.15": 1500, "0.20": 1800, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "3.9": {"0.05": 900, "0.10": 1400, "0.15": 1500, "0.20": 1800, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.0": {"0.05": 900, "0.10": 1400, "0.15": 1600, "0.20": 1800, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.1": {"0.05": 900, "0.10": 1400, "0.15": 1600, "0.20": 1800, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.2": {"0.05": 900, "0.10": 1400, "0.15": 1600, "0.20": 1800, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.3": {"0.05": 900, "0.10": 1400, "0.15": 1600, "0.20": 1900, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.4": {"0.05": 1000, "0.10": 1400, "0.15": 1600, "0.20": 1900, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.5": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": 1900, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.6": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": 1900, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.7": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": 1900, "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.8": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": "Q100", "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "4.9": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": "Q100", "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"},
  "5.0": {"0.05": 1000, "0.10": 1400, "0.15": 1800, "0.20": "Q100", "0.25": "Q100", "0.30": "Q100", "0.35": "Q100", "0.40": "Q100", "0.45": "Q100", "0.50": "Q100"}
};

// Updated standard culvert sizes in mm - including all requested commercial sizes
const STANDARD_CULVERT_SIZES = [300, 400, 500, 600, 700, 800, 900, 1000, 1200, 1400, 1500, 1600, 1800, 1900, 2000];

// Professional engineering threshold in mm
const PROFESSIONAL_ENGINEERING_THRESHOLD = 2000;

// Climate change uplift factors
const CLIMATE_CHANGE_FACTORS = {
  "none": 1.0,
  "2050s": 1.10, // +10%
  "2080s": 1.20  // +20%
};

// Debris rating values for Transport Index calculation
const DEBRIS_RATING_VALUES = {
  "low": 1,
  "medium": 2,
  "high": 3
};

/**
 * Calculate the recommended culvert size based on stream measurements using the California Method
 * 
 * @param {Object} params - Calculation parameters
 * @param {Array<number>} params.topWidths - Array of top width measurements in meters
 * @param {number} params.bottomWidth - Bottom width measurement in meters
 * @param {Array<number>} params.depths - Array of depth measurements in meters
 * @param {Object} [params.transportParams] - Optional transport parameters
 * @param {string} [params.transportParams.debrisRating] - Debris rating (low, medium, high)
 * @param {number} [params.transportParams.sedimentDepth] - Max sediment wedge depth in cm
 * @param {number} [params.transportParams.logDiameter] - Max log diameter in meters
 * @param {string} [params.climateScenario] - Climate projection scenario (none, 2050s, 2080s)
 * @param {number} [params.climateProjectionFactor] - Custom climate projection factor (overrides scenario if provided)
 * @returns {Object} - Calculation results
 */
export const calculateCulvertSize = (params) => {
  const { 
    topWidths, 
    bottomWidth, 
    depths, 
    transportParams = null,
    climateScenario = 'none',
    climateProjectionFactor = null
  } = params;
  
  // Calculate average top width and depth
  const avgTopWidth = topWidths.reduce((sum, width) => sum + width, 0) / topWidths.length;
  const avgDepth = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
  
  // Calculate cross-sectional area using trapezoidal formula
  const crossSectionalArea = ((avgTopWidth + bottomWidth) / 2) * avgDepth;
  
  // Apply the 3x multiplier for end opening area
  const endOpeningArea = crossSectionalArea * 3;
  
  // Calculate required diameter from area
  const requiredRadius = Math.sqrt(endOpeningArea / Math.PI);
  const calculatedDiameter = Math.ceil(requiredRadius * 2 * 1000); // Convert to mm and round up
  
  // Round to nearest standard culvert size
  const areaBased = roundToStandardSize(calculatedDiameter);
  
  // Look up size in California Method table
  const tableBased = lookupCaliforniaMethod(avgTopWidth, avgDepth);
  
  // Check if we need professional design
  let requiresProfessionalDesign = tableBased === "Q100";
  
  // Choose the larger of the two values
  let finalSize;
  if (tableBased === "Q100") {
    finalSize = calculatedDiameter; // Use calculated size if table says professional design
  } else {
    finalSize = Math.max(areaBased, tableBased);
  }

  // Check if the size exceeds the professional engineering threshold
  if (finalSize >= PROFESSIONAL_ENGINEERING_THRESHOLD) {
    requiresProfessionalDesign = true;
  }

  // Calculate Transport Index if transport parameters are provided
  let transportIndex = 0;
  let transportRecommendation = null;
  let transportTips = [];
  let transportAdjustedSize = finalSize;
  
  if (transportParams) {
    const { debrisRating, sedimentDepth, logDiameter } = transportParams;
    
    // Calculate Transport Index with weights
    // w1 = 1.0, w2 = 0.05, w3 = 5.0 (based on importance of each factor)
    const debrisValue = DEBRIS_RATING_VALUES[debrisRating.toLowerCase()] || 1;
    const sedimentValue = sedimentDepth || 0;
    const logValue = logDiameter || 0;
    
    transportIndex = (1.0 * debrisValue) + (0.05 * sedimentValue) + (5.0 * logValue);
    
    // Check if transport index is high enough to warrant size increase
    if (transportIndex >= 4) { // Medium or High threshold
      // Find the next standard size up
      const currentSizeIndex = STANDARD_CULVERT_SIZES.findIndex(size => size >= finalSize);
      if (currentSizeIndex < STANDARD_CULVERT_SIZES.length - 1) {
        transportAdjustedSize = STANDARD_CULVERT_SIZES[currentSizeIndex + 1];
        transportRecommendation = "Size increase recommended due to debris and sediment considerations.";
        transportTips = [
          "Install beveled/flared inlet for improved flow",
          "Create rock-apron at outlet to prevent scour",
          "Consider debris rack upstream for high debris loads",
          "Regular maintenance schedule recommended"
        ];
      }
    }
  }
  
  // Apply climate projection factor
  let climateFactor = 1.0;
  let climateAdjustedSize = transportAdjustedSize;
  
  if (climateProjectionFactor && climateProjectionFactor > 1.0) {
    // Use custom factor if provided
    climateFactor = climateProjectionFactor;
  } else if (climateScenario !== 'none') {
    // Otherwise use scenario-based factor
    climateFactor = CLIMATE_CHANGE_FACTORS[climateScenario] || 1.0;
  }
  
  // Apply climate factor to area calculation
  if (climateFactor > 1.0) {
    const climateAdjustedArea = endOpeningArea * climateFactor;
    const climateAdjustedRadius = Math.sqrt(climateAdjustedArea / Math.PI);
    const climateAdjustedDiameter = Math.ceil(climateAdjustedRadius * 2 * 1000);
    climateAdjustedSize = roundToStandardSize(climateAdjustedDiameter);
    
    // Take the larger of the transport-adjusted and climate-adjusted sizes
    climateAdjustedSize = Math.max(climateAdjustedSize, transportAdjustedSize);
  }
  
  // Final recommended size is the largest of all adjustments
  const recommendedSize = climateAdjustedSize;
  
  // Update professional design recommendation if the final recommended size exceeds threshold
  if (recommendedSize >= PROFESSIONAL_ENGINEERING_THRESHOLD) {
    requiresProfessionalDesign = true;
  }
  
  return {
    // Basic measurements
    averageTopWidth: avgTopWidth,
    averageDepth: avgDepth,
    crossSectionalArea: crossSectionalArea,
    endOpeningArea: endOpeningArea,
    
    // California Method results
    calculatedDiameter: calculatedDiameter,
    areaBased: areaBased,
    tableBased: tableBased !== "Q100" ? tableBased : null,
    requiresProfessionalDesign: requiresProfessionalDesign,
    baseSize: finalSize,
    
    // Transport assessment
    transportIndex: transportIndex,
    transportRecommendation: transportRecommendation,
    transportTips: transportTips,
    transportAdjustedSize: transportAdjustedSize,
    
    // Climate projection
    climateScenario: climateScenario,
    climateFactor: climateFactor,
    climateAdjustedSize: climateAdjustedSize,
    
    // Final recommendation
    recommendedSize: recommendedSize
  };
};

/**
 * Round a diameter value to the nearest standard culvert size
 * 
 * @param {number} diameter - Diameter in millimeters
 * @returns {number} - Nearest standard size (rounded up)
 */
const roundToStandardSize = (diameter) => {
  // Find the first standard size that is >= the calculated diameter
  for (const size of STANDARD_CULVERT_SIZES) {
    if (size >= diameter) {
      return size;
    }
  }
  
  // If larger than all standard sizes, return the largest standard size
  // and recommend professional engineering
  return STANDARD_CULVERT_SIZES[STANDARD_CULVERT_SIZES.length - 1];
};

/**
 * Look up culvert size using California Method table
 * 
 * @param {number} width - Average stream width in meters
 * @param {number} depth - Average stream depth in meters
 * @returns {number|string} - Recommended culvert size or "Q100" if professional design required
 */
const lookupCaliforniaMethod = (width, depth) => {
  // Round width to nearest 0.1m
  const widthKey = (Math.round(width * 10) / 10).toFixed(1);
  
  // Round depth to nearest 0.05m
  const depthKey = (Math.round(depth * 20) / 20).toFixed(2);
  
  // Ensure depth is in proper format (e.g., "0.05", "0.10", etc.)
  const formattedDepthKey = depthKey.endsWith('0') ? depthKey.slice(0, -1) : depthKey;
  
  // Check if width is outside table range
  if (parseFloat(widthKey) < 0.1) {
    return CALIFORNIA_METHOD_TABLE["0.1"]["0.05"]; // Minimum size
  }
  if (parseFloat(widthKey) > 5.0) {
    return "Q100"; // Professional design required for very large streams
  }
  
  // Check if depth is outside table range
  if (parseFloat(formattedDepthKey) < 0.05) {
    return CALIFORNIA_METHOD_TABLE[widthKey]["0.05"]; // Use minimum depth
  }
  if (parseFloat(formattedDepthKey) > 0.50) {
    return "Q100"; // Professional design required for very deep streams
  }
  
  // Look up in table
  try {
    // If exact width key exists
    if (CALIFORNIA_METHOD_TABLE[widthKey]) {
      // If exact depth key exists
      if (CALIFORNIA_METHOD_TABLE[widthKey][formattedDepthKey]) {
        return CALIFORNIA_METHOD_TABLE[widthKey][formattedDepthKey];
      }
      
      // Find nearest depth key
      const depthKeys = Object.keys(CALIFORNIA_METHOD_TABLE[widthKey])
        .map(k => parseFloat(k))
        .sort((a, b) => a - b);
      
      // Find the nearest depth that is >= to the input depth
      const depthValue = parseFloat(formattedDepthKey);
      for (const key of depthKeys) {
        if (key >= depthValue) {
          return CALIFORNIA_METHOD_TABLE[widthKey][key.toFixed(2)];
        }
      }
      
      // If no larger depth key exists, use the largest one
      const maxDepthKey = Math.max(...depthKeys).toFixed(2);
      return CALIFORNIA_METHOD_TABLE[widthKey][maxDepthKey];
    }
    
    // Find nearest width key
    const widthKeys = Object.keys(CALIFORNIA_METHOD_TABLE)
      .map(k => parseFloat(k))
      .sort((a, b) => a - b);
    
    // Find the nearest width that is >= to the input width
    const widthValue = parseFloat(widthKey);
    for (const key of widthKeys) {
      if (key >= widthValue) {
        return lookupCaliforniaMethod(key, depth);
      }
    }
    
    // If no larger width key exists, use the largest one
    const maxWidthKey = Math.max(...widthKeys).toFixed(1);
    return lookupCaliforniaMethod(maxWidthKey, depth);
  } catch (error) {
    console.error('Error in culvert size lookup:', error);
    return "Q100"; // Default to professional design if lookup error
  }
};

/**
 * Simplified function to calculate culvert diameter based on watershed area (fallback method)
 * For use when stream measurements are not available
 * 
 * @param {number} watershedArea - Watershed area in square kilometers
 * @param {number} precipitation - Precipitation intensity in mm/hour
 * @param {Object} [options] - Additional options
 * @param {Object} [options.transportParams] - Transport parameters
 * @param {string} [options.climateScenario] - Climate projection scenario
 * @param {number} [options.climateProjectionFactor] - Custom climate projection factor
 * @returns {Object} - Calculation results including recommended size
 */
export const calculateCulvertDiameterAdvanced = (watershedArea, precipitation, options = {}) => {
  const { 
    transportParams = null,
    climateScenario = 'none',
    climateProjectionFactor = null
  } = options;
  
  // Get climate factor
  let climateFactor = 1.0;
  if (climateProjectionFactor && climateProjectionFactor > 1.0) {
    climateFactor = climateProjectionFactor;
  } else if (climateScenario !== 'none') {
    climateFactor = CLIMATE_CHANGE_FACTORS[climateScenario] || 1.0;
  }
  
  // Basic calculation formula
  const runoff = 0.3; // Runoff coefficient (simplified)
  const baseFlowRate = watershedArea * precipitation * runoff;
  
  // Apply climate factor to flow rate
  const adjustedFlowRate = baseFlowRate * climateFactor;
  
  // Convert flow rate to recommended culvert diameter (simple approximation)
  const baseDiameter = Math.sqrt(baseFlowRate * 1000) * 30;
  const climateDiameter = Math.sqrt(adjustedFlowRate * 1000) * 30;
  
  // Round up to nearest standard culvert size
  const baseSize = roundToStandardSize(baseDiameter);
  const climateAdjustedSize = roundToStandardSize(climateDiameter);
  
  // Calculate Transport Index if transport parameters are provided
  let transportIndex = 0;
  let transportRecommendation = null;
  let transportTips = [];
  let transportAdjustedSize = climateAdjustedSize;
  
  if (transportParams) {
    const { debrisRating, sedimentDepth, logDiameter } = transportParams;
    
    // Calculate Transport Index with weights
    const debrisValue = DEBRIS_RATING_VALUES[debrisRating?.toLowerCase()] || 1;
    const sedimentValue = sedimentDepth || 0;
    const logValue = logDiameter || 0;
    
    transportIndex = (1.0 * debrisValue) + (0.05 * sedimentValue) + (5.0 * logValue);
    
    // Check if transport index is high enough to warrant size increase
    if (transportIndex >= 4) { // Medium or High threshold
      // Find the next standard size up
      const currentSizeIndex = STANDARD_CULVERT_SIZES.findIndex(size => size >= climateAdjustedSize);
      if (currentSizeIndex < STANDARD_CULVERT_SIZES.length - 1) {
        transportAdjustedSize = STANDARD_CULVERT_SIZES[currentSizeIndex + 1];
        transportRecommendation = "Size increase recommended due to debris and sediment considerations.";
        transportTips = [
          "Install beveled/flared inlet for improved flow",
          "Create rock-apron at outlet to prevent scour",
          "Consider debris rack upstream for high debris loads",
          "Regular maintenance schedule recommended"
        ];
      }
    }
  }
  
  // Final recommended size
  const recommendedSize = transportAdjustedSize;
  
  // Check if the size exceeds the professional engineering threshold
  const requiresProfessionalDesign = recommendedSize >= PROFESSIONAL_ENGINEERING_THRESHOLD;
  
  return {
    watershedArea,
    precipitation,
    runoff,
    baseFlowRate,
    adjustedFlowRate,
    baseDiameter,
    baseSize,
    climateFactor,
    climateAdjustedSize,
    transportIndex,
    transportRecommendation,
    transportTips,
    transportAdjustedSize,
    recommendedSize,
    requiresProfessionalDesign
  };
};

/**
 * Legacy function for backward compatibility - simplified version of advanced function
 */
export const calculateCulvertDiameter = (watershedArea, precipitation, climateProjectionFactor = 1.0) => {
  const result = calculateCulvertDiameterAdvanced(watershedArea, precipitation, {
    climateProjectionFactor
  });
  
  return result.recommendedSize;
};

/**
 * Calculate cross-sectional area of a culvert
 * 
 * @param {number} diameter - Culvert diameter in millimeters
 * @returns {number} - Cross-sectional area in square meters
 */
export const calculateCrossSectionalArea = (diameter) => {
  const radius = diameter / 2000; // Convert mm to meters and get radius
  return Math.PI * Math.pow(radius, 2);
};

/**
 * Calculate flow capacity of a culvert
 * 
 * @param {number} diameter - Culvert diameter in millimeters
 * @param {number} slope - Culvert slope as a decimal (e.g., 0.02 for 2%)
 * @returns {number} - Flow capacity in cubic meters per second
 */
export const calculateFlowCapacity = (diameter, slope) => {
  // Manning's equation for circular pipe flow
  const manningsN = 0.013; // Roughness coefficient for concrete pipe
  const radius = diameter / 2000; // Convert mm to meters and get radius
  const area = Math.PI * Math.pow(radius, 2);
  const hydraulicRadius = radius / 2;
  
  // Manning's equation: Q = (1.0/n) * A * R^(2/3) * S^(1/2)
  const flowCapacity = (1.0 / manningsN) * area * Math.pow(hydraulicRadius, 2/3) * Math.pow(slope, 1/2);
  
  return flowCapacity;
};

/**
 * Determine if culvert is appropriately sized for the watershed
 * 
 * @param {number} culvertDiameter - Culvert diameter in millimeters
 * @param {number} requiredDiameter - Required diameter based on calculations
 * @returns {string} - Assessment result ("undersized", "appropriate", or "oversized")
 */
export const assessCulvertSizing = (culvertDiameter, requiredDiameter) => {
  const ratio = culvertDiameter / requiredDiameter;
  
  if (ratio < 0.9) {
    return "undersized";
  } else if (ratio > 1.5) {
    return "oversized";
  } else {
    return "appropriate";
  }
};

/**
 * Get culvert size description with context
 * 
 * @param {number} diameter - Culvert diameter in millimeters
 * @returns {string} - Human-readable description of culvert size
 */
export const getCulvertSizeDescription = (diameter) => {
  if (diameter < 400) {
    return `Small culvert (${diameter}mm)`;
  } else if (diameter < 800) {
    return `Medium culvert (${diameter}mm)`;
  } else if (diameter < 1200) {
    return `Large culvert (${diameter}mm)`;
  } else if (diameter < 2000) {
    return `Very large culvert (${diameter}mm)`;
  } else {
    return `Professional engineering design recommended (${diameter}mm)`;
  }
};
