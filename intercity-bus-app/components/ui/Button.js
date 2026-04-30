import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/Colors';

export const Button = ({ title, onPress, style, textStyle, type = 'primary', loading = false, disabled = false }) => {
  const isPrimary = type === 'primary';
  const isOutline = type === 'outline';
  const isDanger = type === 'danger';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        type === 'secondary' && styles.secondaryButton,
        isOutline && styles.outlineButton,
        isDanger && styles.dangerButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled || !onPress}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#000' : Colors.primary} />
      ) : (
        <Text style={[
          styles.text,
          isPrimary && styles.primaryText,
          type === 'secondary' && styles.secondaryText,
          isOutline && styles.outlineText,
          isDanger && styles.dangerText,
          textStyle,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryText: {
    color: '#000000',
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  dangerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
  },
});
