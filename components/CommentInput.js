import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

/**
 * Component for adding field notes and comments to reports
 * @param {string} value - Current comment text
 * @param {function} onChangeText - Function to call when text changes
 * @returns {JSX.Element} Styled comment input component
 */
const CommentInput = ({ value, onChangeText }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Field Notes & Comments</Text>
      <TextInput
        style={[
          styles.input,
          isFocused && styles.focusedInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Add notes about site conditions, observations, or recommendations..."
        multiline={true}
        numberOfLines={4}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        textAlignVertical="top"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2c5e2e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  focusedInput: {
    borderColor: '#2c5e2e',
    borderWidth: 2,
    backgroundColor: '#fff',
  },
});

export default CommentInput;