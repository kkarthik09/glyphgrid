import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { COLORS } from './theme';

type Props = {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, secondary, disabled, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.label, secondary && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  secondary: { backgroundColor: COLORS.panel2, borderColor: COLORS.border },
  label: { color: COLORS.bg, fontWeight: '900', fontSize: 16, letterSpacing: 0.2 },
  secondaryLabel: { color: COLORS.text },
  disabled: { opacity: 0.42 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.88 },
});
