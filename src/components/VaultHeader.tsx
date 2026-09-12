import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';
import { Glyph, type GlyphName } from './Glyph';

export function VaultHeader({
  title,
  subtitle,
  onSearch,
  onLock,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  onSearch?: () => void;
  onLock?: () => void;
  onBack?: () => void;
  action?: { icon: GlyphName; onPress: () => void };
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={10}>
            <Glyph name="chevron.left" size={22} color={colors.ink} />
          </Pressable>
        ) : null}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {onSearch ? (
          <Pressable onPress={onSearch} style={styles.iconBtn} hitSlop={8}>
            <Glyph name="magnifyingglass" size={20} color={colors.ink} />
          </Pressable>
        ) : null}
        {action ? (
          <Pressable onPress={action.onPress} style={styles.iconBtn} hitSlop={8}>
            <Glyph name={action.icon} size={20} color={colors.gold} />
          </Pressable>
        ) : null}
        {onLock ? (
          <Pressable onPress={onLock} style={styles.iconBtn} hitSlop={8}>
            <Glyph name="lock.fill" size={18} color={colors.gold} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  title: { fontFamily: fonts.sansSemi, fontSize: 28, color: colors.ink, lineHeight: 32, letterSpacing: -0.5 },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, marginTop: 2 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
