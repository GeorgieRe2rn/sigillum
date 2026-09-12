import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Glyph, type GlyphName } from './Glyph';

export function EmptyState({
  icon,
  title,
  body,
}: {
  icon: GlyphName;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <Glyph name={icon} size={28} color={colors.gold} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48, gap: 10 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});
