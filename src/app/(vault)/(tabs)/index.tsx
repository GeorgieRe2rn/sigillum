import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DevicePlate } from '../../../components/DevicePlate';
import { EmptyState } from '../../../components/EmptyState';
import { Glyph } from '../../../components/Glyph';
import { ItemCard } from '../../../components/ItemCard';
import { VaultHeader } from '../../../components/VaultHeader';
import { useSession } from '../../../context/SessionContext';
import { formatBytes, formatCountdown, kindLabel } from '../../../lib/format';
import { isSealed, vaultStats } from '../../../lib/vault';
import { colors, fonts, radius } from '../../../theme';

export default function ArchiveHome() {
  const { items, settings, lock, fileUriFor, biometric } = useSession();
  const stats = vaultStats(items);
  const recent = items.slice(0, 8);
  const capsules = items.filter((item) => isSealed(item));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <VaultHeader
          title={settings.displayName}
          subtitle="Archivo sellado"
          onSearch={() => router.push('/search')}
          onLock={lock}
        />
        <DevicePlate biometric={biometric} compact />

        <View style={styles.stats}>
          <Stat n={stats.photos} label="fotos" />
          <Stat n={stats.videos} label="vídeos" />
          <Stat n={stats.documents} label="docs" />
          <Stat n={formatBytes(stats.bytes)} label="en disco" text />
        </View>

        <View style={styles.actions}>
          <Action title="Sellar" icon="plus" onPress={() => router.push('/import')} primary />
          <Action title="Cámara" icon="camera.fill" onPress={() => router.push('/import')} />
          <Action title="Documento" icon="folder.fill" onPress={() => router.push('/import')} />
        </View>

        {capsules.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cápsulas</Text>
            {capsules.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => router.push(`/item/${item.id}`)}
                style={styles.capsule}
              >
                <Glyph name="hourglass" size={18} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.capsuleTitle}>{item.title}</Text>
                  <Text style={styles.capsuleSub}>
                    Se abre en {formatCountdown(item.sealedUntil ?? 0)} · {kindLabel(item.kind)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recientes</Text>
          {recent.length === 0 ? (
            <EmptyState
              icon="checkmark.seal.fill"
              title="Nada está sellado todavía"
              body="Importa una foto, un vídeo o un documento. Quedará en este teléfono, detrás de tu sello."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {recent.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  uri={fileUriFor(item)}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ n, label, text }: { n: number | string; label: string; text?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statN, text && styles.statText]}>{n}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

function Action({
  title,
  icon,
  onPress,
  primary,
}: {
  title: string;
  icon: 'plus' | 'camera.fill' | 'folder.fill';
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.action, primary && styles.actionPrimary]}>
      <Glyph name={icon} size={18} color={primary ? colors.bg : colors.gold} />
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 14,
    marginBottom: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: fonts.serif, color: colors.ink, fontSize: 26 },
  statText: { fontSize: 16, marginTop: 6 },
  statL: { fontFamily: fonts.sans, color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  action: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionPrimary: { backgroundColor: colors.gold, borderColor: colors.gold },
  actionLabel: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 13 },
  actionLabelPrimary: { color: colors.bg },
  section: { marginBottom: 28 },
  sectionTitle: {
    fontFamily: fonts.sansMedium,
    color: colors.gold,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    fontSize: 11,
    marginBottom: 12,
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: colors.waxDeep,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  capsuleTitle: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 15 },
  capsuleSub: { fontFamily: fonts.sans, color: colors.goldSoft, fontSize: 12, marginTop: 2 },
});
