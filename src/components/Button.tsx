import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../theme';

type Variant = 'gold' | 'wax' | 'ghost' | 'danger' | 'ink';

export function Button({
  title,
  onPress,
  variant = 'gold',
  disabled,
  loading,
  icon,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.gold : colors.bg} />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'danger' ? styles.dangerLabel : variant === 'ghost' || variant === 'ink' ? styles.ghostLabel : styles.solidLabel,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  gold: { backgroundColor: colors.gold },
  wax: { backgroundColor: colors.wax },
  ink: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.line },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.sansSemi, fontSize: 16, letterSpacing: 0.2 },
  solidLabel: { color: colors.bg },
  ghostLabel: { color: colors.ink },
  dangerLabel: { color: colors.danger },
});
