/**
 * Culvert Calculator Utility
 * Functions for calculating culvert sizes based on field measurements
 */

/**
 * Calculate recommended culvert diameter based on watershed area and precipitation
 * 
 * @param {number} watershedArea - Watershed area in square kilometers
 * @param {number} precipitation - Precipitation intensity in mm/hour
 * @param {number} [climateProjectionFactor=1.0] - Climate change projection factor (default: 1.0)
 * @returns {number} - Recommended culvert diameter in millimeters
 */
export const calculateCulvertDiameter = (watershedArea, precipitation, climateProjectionFactor = 1.0) => {
  // Basic calculation formula (simplified for initial implementation)
  // This should be replaced with actual engineering formulas based on local regulations
  const runoff = 0.3; // Runoff coefficient (simplified)
  const flowRate = watershedArea * precipitation * runoff * climateProjectionFactor;
  
  // Convert flow rate to recommended culvert diameter (simple approximation)
  // More sophisticated calculations should be implemented based on hydraulic principles
  const diameter = Math.sqrt(flowRate * 1000) * 30;
  
  // Round up to nearest standard culvert size (in mm)
  const standardSizes = [300, 400, 500, 600, 800, 1000, 1200, 1500, 1800, 2000];
  for (const size of standardSizes) {
    if (size >= diameter) {
      return size;
    }
  }
  
  return 2000; // Return largest standard size if exceeds all
};

/**
 * Calculate cross-sectional area required for the culvert
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
  // Manning's equation for circular pipe flow (simplified)
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
  } else {
    return `Very large culvert (${diameter}mm)`;
  }
};
