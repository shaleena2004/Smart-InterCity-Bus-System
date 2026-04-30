import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export const AlertBanner = ({ type = 'info', message, onRetry }) => {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'rgba(255, 68, 68, 0.1)' : 'rgba(33, 150, 243, 0.1)';
  const textColor = isError ? '#ff4444' : '#2196f3';
  const icon = isError ? 'alert-circle' : 'information-circle';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor: textColor }]}>
      <Ionicons name={icon} size={20} color={textColor} />
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
          <Text style={[styles.retryText, { color: textColor }]}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
