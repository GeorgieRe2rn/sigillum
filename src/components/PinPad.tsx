import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius } from '../theme';
import { Glyph } from './Glyph';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const;

export function PinDots({ length, filled, error }: { length: number; filled: number; error?: boolean }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < filled && styles.dotFilled,
            error && styles.dotError,
          ]}
        />
      ))}
    </View>
  );
}

export function PinPad({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const press = (key: (typeof KEYS)[number]) => {
    if (disabled) return;
    if (key === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= 6) return;
    onChange(value + key);
  };

  return (
    <View style={styles.pad}>
      {KEYS.map((key) => (
        <Pressable
          key={key || 'blank'}
          onPress={() => press(key)}
          disabled={disabled || key === ''}
          style={({ pressed }) => [
            styles.key,
            key === '' && styles.blank,
            pressed && key !== '' && styles.keyPressed,
          ]}
        >
          {key === 'del' ? (
            <Glyph name="xmark" size={18} color={colors.ink} />
          ) : (
            <Text style={styles.keyLabel}>{key}</Text>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginBottom: 28 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.gold,
    backgroundColor: 'transparent',
  },
  dotFilled: { backgroundColor: colors.gold },
  dotError: { borderColor: colors.danger, backgroundColor: colors.danger },
  pad: {
    width: 276,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    alignSelf: 'center',
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
  },
  blank: { backgroundColor: 'transparent', borderColor: 'transparent' },
  keyPressed: { backgroundColor: colors.bgInput },
  keyLabel: {
    color: colors.ink,
    fontFamily: fonts.serif,
    fontSize: 28,
  },
});
