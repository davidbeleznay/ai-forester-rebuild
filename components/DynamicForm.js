import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import FormManager from '../utils/FormManager';

/**
 * Dynamic Form Component
 * Renders form fields based on field definitions from FormManager
 * 
 * @param {Object} props
 * @param {string} props.formType - Type of form to render
 * @param {Object} props.initialValues - Initial values for the form (optional)
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {Boolean} props.isLoading - Whether the form is in a loading state
 * @param {String} props.submitButtonText - Text for the submit button (defaults to "Submit")
 */
const DynamicForm = ({
  formType,
  initialValues = {},
  onSubmit,
  onCancel,
  isLoading = false,
  submitButtonText = "Submit"
}) => {
  const [fields, setFields] = useState([]);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [touched, setTouched] = useState({});

  // Load form field definitions
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        const formFields = await FormManager.getFormFields(formType);
        setFields(formFields);
        
        // Set initial values
        const defaultValues = FormManager.getInitialValues(formFields);
        setValues({ ...defaultValues, ...initialValues });
      } catch (error) {
        console.error('Error loading form fields:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFields();
  }, [formType, initialValues]);

  // Update field value
  const handleChange = (id, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [id]: value
    }));
    
    // Mark field as touched
    if (!touched[id]) {
      setTouched(prev => ({
        ...prev,
        [id]: true
      }));
    }
    
    // Clear error when value changes
    if (errors[id]) {
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Mark all fields as touched
    const allTouched = {};
    fields.forEach(field => {
      allTouched[field.id] = true;
    });
    setTouched(allTouched);
    
    // Validate form
    const validation = FormManager.validateForm(fields, values);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    Keyboard.dismiss();
    onSubmit(values);
  };

  // Determine if a field should be displayed based on dependencies
  const shouldShowField = (field) => {
    if (!field.dependsOn) return true;
    
    const { field: dependsOnField, value: dependsOnValue } = field.dependsOn;
    return values[dependsOnField] === dependsOnValue;
  };

  // Render a specific field based on its type
  const renderField = (field) => {
    // Skip rendering if field shouldn't be shown
    if (!shouldShowField(field)) return null;
    
    const { id, label, type, placeholder, required, options } = field;
    const value = values[id];
    const hasError = touched[id] && errors[id];
    
    const commonProps = {
      key: id,
      style: [
        styles.fieldContainer,
        hasError && styles.fieldWithError
      ]
    };

    switch (type) {
      case 'text':
        return (
          <View {...commonProps}>
            <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(text) => handleChange(id, text)}
              placeholder={placeholder}
            />
            {hasError && <Text style={styles.errorText}>{errors[id]}</Text>}
          </View>
        );
        
      case 'numeric':
        return (
          <View {...commonProps}>
            <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(text) => handleChange(id, text)}
              placeholder={placeholder}
              keyboardType="numeric"
            />
            {hasError && <Text style={styles.errorText}>{errors[id]}</Text>}
          </View>
        );
        
      case 'textarea':
        return (
          <View {...commonProps}>
            <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={value}
              onChangeText={(text) => handleChange(id, text)}
              placeholder={placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {hasError && <Text style={styles.errorText}>{errors[id]}</Text>}
          </View>
        );
        
      case 'switch':
        return (
          <View {...commonProps}>
            <View style={styles.switchContainer}>
              <Text style={styles.label}>{label}</Text>
              <Switch
                value={value}
                onValueChange={(newValue) => handleChange(id, newValue)}
                trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
                thumbColor={value ? '#2c5e2e' : '#f4f3f4'}
              />
            </View>
            {hasError && <Text style={styles.errorText}>{errors[id]}</Text>}
          </View>
        );
        
      case 'select':
        return (
          <View {...commonProps}>
            <Text style={styles.label}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={value}
                onValueChange={(itemValue) => handleChange(id, itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select..." value="" />
                {options.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
            {hasError && <Text style={styles.errorText}>{errors[id]}</Text>}
          </View>
        );
        
      default:
        return null;
    }
  };

  // Show loading indicator while fields are being loaded
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5e2e" />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {fields.map(field => renderField(field))}
        
        <View style={styles.buttonContainer}>
          {onCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel} disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{submitButtonText}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldWithError: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  required: {
    color: '#e53935',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  errorText: {
    color: '#e53935',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#555',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#2c5e2e',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#90a496',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
});

export default DynamicForm;