import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { generateReport, shareReport } from '../utils/reportGenerator';
import { Feather } from '@expo/vector-icons';

/**
 * Button component for generating and sharing reports
 * @param {Object} fieldData - The field data to include in the report
 * @param {String} comments - Comments to include in the report
 * @returns {JSX.Element} Export button component
 */
const ExportButton = ({ fieldData, comments = '' }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    try {
      setIsGenerating(true);
      const reportUri = await generateReport(fieldData, comments);
      await shareReport(reportUri);
    } catch (error) {
      console.error('Report export error:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handleExport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Feather name="file-text" size={20} color="#fff" />
          <Text style={styles.buttonText}>Export Report</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2c5e2e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExportButton;