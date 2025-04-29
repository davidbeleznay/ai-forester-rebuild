import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import FormManager from '../../utils/FormManager';
import { useNetwork } from '../../utils/NetworkContext';

/**
 * Form Configuration Screen
 * Allows users to customize form fields for different form types
 */
const FormConfigScreen = ({ route, navigation }) => {
  const { formType } = route.params || { formType: 'culvert_california' };
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isConnected } = useNetwork();

  // Load form field definitions
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        const formFields = await FormManager.getFormFields(formType);
        setFields(formFields);
      } catch (error) {
        console.error('Error loading form fields:', error);
        Alert.alert('Error', 'Failed to load form configuration.');
      } finally {
        setLoading(false);
      }
    };
    
    loadFields();
  }, [formType]);

  // Update field property
  const updateField = (index, property, value) => {
    const updatedFields = [...fields];
    updatedFields[index] = {
      ...updatedFields[index],
      [property]: value
    };
    setFields(updatedFields);
  };

  // Toggle field required status
  const toggleRequired = (index) => {
    const updatedFields = [...fields];
    updatedFields[index] = {
      ...updatedFields[index],
      required: !updatedFields[index].required
    };
    setFields(updatedFields);
  };

  // Move field up in the list
  const moveFieldUp = (index) => {
    if (index === 0) return;
    
    const updatedFields = [...fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[index - 1];
    updatedFields[index - 1] = temp;
    setFields(updatedFields);
  };

  // Move field down in the list
  const moveFieldDown = (index) => {
    if (index === fields.length - 1) return;
    
    const updatedFields = [...fields];
    const temp = updatedFields[index];
    updatedFields[index] = updatedFields[index + 1];
    updatedFields[index + 1] = temp;
    setFields(updatedFields);
  };

  // Save form configuration
  const saveConfiguration = async () => {
    try {
      setSaving(true);
      
      // Validate that required fields have proper validation
      for (const field of fields) {
        if (field.required && (!field.validation || typeof field.validation !== 'function')) {
          Alert.alert(
            'Validation Error',
            `Required field "${field.label}" must have a validation function.`
          );
          setSaving(false);
          return;
        }
      }
      
      // Save form definition
      await FormManager.saveFormDefinition(formType, fields);
      
      Alert.alert(
        'Success',
        'Form configuration saved successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving form configuration:', error);
      Alert.alert('Error', 'Failed to save form configuration.');
    } finally {
      setSaving(false);
    }
  };

  // Reset to default configuration
  const resetToDefault = () => {
    Alert.alert(
      'Reset Configuration',
      'Are you sure you want to reset to the default configuration? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const defaultFields = FormManager.getDefaultFields(formType);
              setFields(defaultFields);
              setLoading(false);
            } catch (error) {
              console.error('Error resetting form configuration:', error);
              Alert.alert('Error', 'Failed to reset form configuration.');
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render different field types
  const renderFieldEditor = (field, index) => {
    return (
      <View key={field.id} style={styles.fieldEditor}>
        <View style={styles.fieldHeader}>
          <Text style={styles.fieldId}>{field.id}</Text>
          <View style={styles.fieldControls}>
            <TouchableOpacity 
              style={[styles.controlButton, index === 0 && styles.disabledButton]}
              onPress={() => moveFieldUp(index)}
              disabled={index === 0}
            >
              <Feather name="arrow-up" size={18} color={index === 0 ? '#aaa' : '#2c5e2e'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, index === fields.length - 1 && styles.disabledButton]}
              onPress={() => moveFieldDown(index)}
              disabled={index === fields.length - 1}
            >
              <Feather name="arrow-down" size={18} color={index === fields.length - 1 ? '#aaa' : '#2c5e2e'} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.fieldProperty}>
          <Text style={styles.propertyLabel}>Label:</Text>
          <TextInput
            style={styles.propertyInput}
            value={field.label}
            onChangeText={(text) => updateField(index, 'label', text)}
            placeholder="Field Label"
          />
        </View>
        
        <View style={styles.fieldProperty}>
          <Text style={styles.propertyLabel}>Type:</Text>
          <Text style={styles.propertyValue}>{field.type}</Text>
        </View>
        
        {field.type === 'text' || field.type === 'numeric' || field.type === 'textarea' ? (
          <View style={styles.fieldProperty}>
            <Text style={styles.propertyLabel}>Placeholder:</Text>
            <TextInput
              style={styles.propertyInput}
              value={field.placeholder}
              onChangeText={(text) => updateField(index, 'placeholder', text)}
              placeholder="Field Placeholder"
            />
          </View>
        ) : null}
        
        <View style={styles.fieldProperty}>
          <Text style={styles.propertyLabel}>Required:</Text>
          <Switch
            value={field.required || false}
            onValueChange={() => toggleRequired(index)}
            trackColor={{ false: '#d1d1d1', true: '#81b0ff' }}
            thumbColor={field.required ? '#2c5e2e' : '#f4f3f4'}
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2c5e2e" />
        <Text style={styles.loadingText}>Loading form configuration...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Connection status */}
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusIndicator,
            isConnected ? styles.onlineIndicator : styles.offlineIndicator
          ]}
        />
        <Text style={styles.statusText}>
          {isConnected ? 'Online' : 'Offline Mode'}
        </Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Form Configuration</Text>
          <Text style={styles.subtitle}>
            {formType === 'culvert_california' && 'California Method Form'}
            {formType === 'culvert_area_based' && 'Area-Based Method Form'}
            {formType === 'water_transport' && 'Water Transport Assessment Form'}
          </Text>
        </View>
        
        <View style={styles.infoBox}>
          <Feather name="info" size={18} color="#2c5e2e" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Customize the form fields by changing labels, placeholders, and order.
            You can also toggle whether fields are required.
          </Text>
        </View>
        
        {fields.map((field, index) => renderFieldEditor(field, index))}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDefault}
            disabled={saving}
          >
            <Feather name="refresh-cw" size={18} color="#e53935" />
            <Text style={styles.resetButtonText}>Reset to Default</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={saveConfiguration}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="save" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Configuration</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineIndicator: {
    backgroundColor: '#4CAF50',
  },
  offlineIndicator: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c5e2e',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  fieldEditor: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  fieldId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c5e2e',
  },
  fieldControls: {
    flexDirection: 'row',
  },
  controlButton: {
    padding: 5,
    marginLeft: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  fieldProperty: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  propertyLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
  },
  propertyValue: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  propertyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e53935',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '45%',
  },
  resetButtonText: {
    color: '#e53935',
    fontWeight: '500',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2c5e2e',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: '50%',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
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

export default FormConfigScreen;