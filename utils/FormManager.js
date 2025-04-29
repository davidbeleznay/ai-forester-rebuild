/**
 * Form Manager
 * Utility for managing dynamic form field definitions and validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class FormManager {
  /**
   * Get form field definitions by form type
   * @param {string} formType - Type of form to retrieve
   * @returns {Promise<Array>} - Array of field definitions
   */
  static async getFormFields(formType) {
    try {
      // Get stored form definitions or use defaults
      const storedDefinitions = await AsyncStorage.getItem('@form_definitions');
      const formDefinitions = storedDefinitions ? JSON.parse(storedDefinitions) : {};
      
      // Return form fields for the requested type or empty array if not found
      return formDefinitions[formType] || this.getDefaultFields(formType);
    } catch (error) {
      console.error(`Error getting form fields for ${formType}:`, error);
      // Fallback to default fields
      return this.getDefaultFields(formType);
    }
  }
  
  /**
   * Get default field definitions for a form type
   * @param {string} formType - Type of form
   * @returns {Array} - Default field definitions
   */
  static getDefaultFields(formType) {
    switch(formType) {
      case 'culvert_california':
        return [
          {
            id: 'streamId',
            label: 'Stream/Culvert ID',
            type: 'text',
            required: true,
            placeholder: 'Enter stream or culvert ID',
            validation: value => !!value || 'ID is required',
          },
          {
            id: 'location',
            label: 'Location',
            type: 'text',
            required: true,
            placeholder: 'Enter location description',
            validation: value => !!value || 'Location is required',
          },
          {
            id: 'useGps',
            label: 'Use Current GPS Location',
            type: 'switch',
            defaultValue: true,
          },
          {
            id: 'topWidth1',
            label: 'Top Width 1 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid width above 0';
            },
          },
          {
            id: 'depth1',
            label: 'Depth 1 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid depth above 0';
            },
          },
          {
            id: 'topWidth2',
            label: 'Top Width 2 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid width above 0';
            },
          },
          {
            id: 'depth2',
            label: 'Depth 2 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid depth above 0';
            },
          },
          {
            id: 'topWidth3',
            label: 'Top Width 3 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid width above 0';
            },
          },
          {
            id: 'depth3',
            label: 'Depth 3 (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid depth above 0';
            },
          },
          {
            id: 'bottomWidth',
            label: 'Bottom Width (m)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num >= 0) || 'Enter a valid width (0 or above)';
            },
          },
          {
            id: 'comments',
            label: 'Field Notes',
            type: 'textarea',
            placeholder: 'Enter any additional notes or observations',
            multiline: true,
            numberOfLines: 4,
          }
        ];
      
      case 'culvert_area_based':
        return [
          {
            id: 'streamId',
            label: 'Stream/Culvert ID',
            type: 'text',
            required: true,
            placeholder: 'Enter stream or culvert ID',
            validation: value => !!value || 'ID is required',
          },
          {
            id: 'location',
            label: 'Location',
            type: 'text',
            required: true,
            placeholder: 'Enter location description',
            validation: value => !!value || 'Location is required',
          },
          {
            id: 'useGps',
            label: 'Use Current GPS Location',
            type: 'switch',
            defaultValue: true,
          },
          {
            id: 'watershedArea',
            label: 'Watershed Area (km²)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid area above 0';
            },
          },
          {
            id: 'precipitation',
            label: 'Precipitation Intensity (mm/hr)',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0) || 'Enter a valid precipitation above 0';
            },
          },
          {
            id: 'runoffCoefficient',
            label: 'Runoff Coefficient',
            type: 'numeric',
            required: true,
            placeholder: '0.00',
            defaultValue: '0.45',
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num > 0 && num <= 1) || 'Enter a value between 0 and 1';
            },
          },
          {
            id: 'climateFactorEnabled',
            label: 'Apply Climate Change Factor',
            type: 'switch',
            defaultValue: false,
          },
          {
            id: 'climateFactor',
            label: 'Climate Change Factor',
            type: 'numeric',
            required: false,
            placeholder: '1.00',
            defaultValue: '1.2',
            dependsOn: {
              field: 'climateFactorEnabled',
              value: true
            },
            validation: value => {
              const num = parseFloat(value);
              return (!!value && !isNaN(num) && num >= 1) || 'Enter a value of 1 or greater';
            },
          },
          {
            id: 'comments',
            label: 'Field Notes',
            type: 'textarea',
            placeholder: 'Enter any additional notes or observations',
            multiline: true,
            numberOfLines: 4,
          }
        ];
      
      case 'water_transport':
        return [
          {
            id: 'bankfullWidth',
            label: 'Bankfull Width Rating',
            type: 'select',
            required: true,
            options: [
              { label: 'Low (≤2m)', value: 'low' },
              { label: 'Medium (>2-3.5m)', value: 'medium' },
              { label: 'High (>3.5m)', value: 'high' }
            ],
            validation: value => !!value || 'Selection required',
          },
          {
            id: 'sedimentStorage',
            label: 'Sediment in Storage Wedges',
            type: 'select',
            required: true,
            options: [
              { label: 'Low (≤100mm)', value: 'low' },
              { label: 'Medium (>100-200mm)', value: 'medium' },
              { label: 'High (>200mm)', value: 'high' }
            ],
            validation: value => !!value || 'Selection required',
          },
          {
            id: 'woodyDebris',
            label: 'Water-transported Woody Debris',
            type: 'select',
            required: true,
            options: [
              { label: 'None', value: 'none' },
              { label: 'Small', value: 'small' },
              { label: 'Large', value: 'large' },
              { label: 'Logs', value: 'logs' }
            ],
            validation: value => !!value || 'Selection required',
          }
        ];
        
      default:
        return [];
    }
  }
  
  /**
   * Save a new form definition
   * @param {string} formType - Type of form
   * @param {Array} fields - Array of field definitions
   */
  static async saveFormDefinition(formType, fields) {
    try {
      // Get existing definitions
      const storedDefinitions = await AsyncStorage.getItem('@form_definitions');
      const formDefinitions = storedDefinitions ? JSON.parse(storedDefinitions) : {};
      
      // Update form definition
      formDefinitions[formType] = fields;
      
      // Save updated definitions
      await AsyncStorage.setItem('@form_definitions', JSON.stringify(formDefinitions));
      return true;
    } catch (error) {
      console.error(`Error saving form definition for ${formType}:`, error);
      return false;
    }
  }
  
  /**
   * Validate form values against field definitions
   * @param {Array} fields - Field definitions
   * @param {Object} values - Form values
   * @returns {Object} - Object with isValid flag and errors object
   */
  static validateForm(fields, values) {
    const errors = {};
    let isValid = true;
    
    fields.forEach(field => {
      // Skip validation if field depends on another field that's not active
      if (field.dependsOn) {
        const dependencyField = field.dependsOn.field;
        const dependencyValue = field.dependsOn.value;
        
        if (values[dependencyField] !== dependencyValue) {
          return;
        }
      }
      
      // Skip validation for non-required fields with no value
      if (!field.required && (!values[field.id] || values[field.id] === '')) {
        return;
      }
      
      // Validate field
      if (field.validation) {
        const validationResult = field.validation(values[field.id]);
        
        if (validationResult !== true) {
          errors[field.id] = validationResult;
          isValid = false;
        }
      }
    });
    
    return { isValid, errors };
  }
  
  /**
   * Generate initial values from field definitions
   * @param {Array} fields - Field definitions
   * @returns {Object} - Initial form values
   */
  static getInitialValues(fields) {
    const initialValues = {};
    
    fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialValues[field.id] = field.defaultValue;
      } else {
        // Set appropriate empty values based on field type
        switch (field.type) {
          case 'numeric':
            initialValues[field.id] = '';
            break;
          case 'switch':
            initialValues[field.id] = false;
            break;
          case 'select':
            initialValues[field.id] = '';
            break;
          default:
            initialValues[field.id] = '';
        }
      }
    });
    
    return initialValues;
  }
}

export default FormManager;