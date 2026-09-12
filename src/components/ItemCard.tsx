import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { isSealed } from '../lib/vault';
import { formatBytes, formatDate, kindLabel } from '../lib/format';
import { colors, fonts, radius } from '../theme';
import type { VaultItem } from '../types';
import { Glyph } from './Glyph';

export function ItemCard({
  item,
  uri,
  onPress,
  compact,
}: {
  item: VaultItem;
  uri: string;
  onPress: () => void;
  compact?: boolean;
}) {
  const sealed = isSealed(item);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.thumb, compact && styles.thumbCompact]}>
        {sealed ? (
          <View style={styles.sealed}>
            <Glyph name="hourglass" size={22} color={colors.gold} />
          </View>
        ) : item.kind === 'photo' ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={styles.kindFill}>
            <Glyph
              name={item.kind === 'video' ? 'play.fill' : 'doc.text.fill'}
              size={22}
              color={colors.gold}
            />
          </View>
        )}
        {item.kind === 'video' && !sealed ? (
          <View style={styles.playBadge}>
            <Glyph name="play.fill" size={12} color={colors.bg} />
          </View>
        ) : null}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {sealed ? 'Cápsula sellada' : `${kindLabel(item.kind)} · ${formatBytes(item.size)}`}
        </Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

export function PhotoTile({ item, uri, onPress }: { item: VaultItem; uri: string; onPress: () => void }) {
  const sealed = isSealed(item);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
      {sealed ? (
        <View style={styles.sealed}>
          <Glyph name="hourglass" size={20} color={colors.gold} />
          <Text style={styles.tileLabel}>Cápsula</Text>
        </View>
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 14,
    padding: 12,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { opacity: 0.86 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgInput,
  },
  thumbCompact: { width: 60, height: 60 },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.bgCard,
  },
  sealed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.waxDeep,
    gap: 6,
  },
  kindFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  playBadge: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 16 },
  sub: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 13, marginTop: 3 },
  date: { fontFamily: fonts.sans, color: colors.inkFaint, fontSize: 12, marginTop: 4 },
  tileLabel: { fontFamily: fonts.sansMedium, color: colors.goldSoft, fontSize: 11 },
});
