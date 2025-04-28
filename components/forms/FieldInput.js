import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZE, SCREEN } from '../../constants/constants';

/**
 * FieldInput Component
 * A reusable input field with label and optional helper text
 * 
 * @param {string} label - Input field label
 * @param {string} value - Current input value
 * @param {function} onChangeText - Function to call when text changes
 * @param {string} [placeholder] - Optional placeholder text
 * @param {string} [helperText] - Optional helper text displayed below the input
 * @param {string} [errorText] - Optional error text displayed in error state
 * @param {Object} [inputProps] - Additional props to pass to TextInput
 * @param {Object} [containerStyle] - Additional styles for the container
 */
const FieldInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  helperText,
  errorText,
  inputProps = {},
  containerStyle = {},
}) => {
  const hasError = !!errorText;
  
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      
      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        {...inputProps}
      />
      
      {(helperText || errorText) && (
        <Text style={[
          styles.helperText,
          hasError && styles.errorText,
        ]}>
          {errorText || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    height: SCREEN.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SCREEN.borderRadius,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  helperText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
  },
});

export default FieldInput;
