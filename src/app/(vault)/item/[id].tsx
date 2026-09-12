import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

import { Button } from '../../../components/Button';
import { Glyph } from '../../../components/Glyph';
import { SealMark } from '../../../components/SealMark';
import { VaultHeader } from '../../../components/VaultHeader';
import { isSealed, useSession } from '../../../context/SessionContext';
import { restoreItem } from '../../../lib/restore';
import { suppressAutoLock } from '../../../lib/lockGate';
import {
  formatBytes,
  formatCountdown,
  formatDateTime,
  kindLabel,
  shortenFingerprint,
} from '../../../lib/format';
import { colors, fonts, radius } from '../../../theme';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, fileUriFor, updateItem, removeItem, confirmSensitive, verifyItem } = useSession();
  const item = items.find((entry) => entry.id === id);
  const [title, setTitle] = useState(item?.title ?? '');
  const [note, setNote] = useState(item?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState<'idle' | 'ok' | 'bad'>('idle');

  const sealed = item ? isSealed(item) : false;
  const uri = item ? fileUriFor(item) : '';

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <VaultHeader title="Sello" onBack={() => router.back()} />
        <Text style={styles.missing}>Este sello ya no está en el archivo.</Text>
      </SafeAreaView>
    );
  }

  const saveMeta = async () => {
    await updateItem(item.id, { title: title.trim() || item.fileName, note });
  };

  const onExport = async () => {
    setBusy(true);
    try {
      await suppressAutoLock(async () => {
        const ok = await confirmSensitive('Devolver este sello a la galería o a Archivos');
        if (!ok) return;
        const result = await restoreItem(item);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Exportado',
          result.destination === 'gallery'
            ? 'Volvió a Fotos. Sigue también en Sigillum hasta que lo borres aquí.'
            : 'Usa la hoja de compartir para guardarlo donde estaba (Archivos, Drive, etc.).',
        );
      });
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Romper el sello', `Se borrará «${item.title}» de este teléfono.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await suppressAutoLock(async () => {
              const ok = await confirmSensitive('Borrar este sello del archivo');
              if (!ok) return;
              await removeItem(item.id);
              router.back();
            });
          } catch (error) {
            Alert.alert('No se pudo borrar', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const onVerify = async () => {
    setBusy(true);
    const ok = await verifyItem(item);
    setVerify(ok ? 'ok' : 'bad');
    setBusy(false);
    await Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
  };

  const copyFp = async () => {
    await Clipboard.setStringAsync(item.fingerprint);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.pad}>
        <VaultHeader title={kindLabel(item.kind)} onBack={() => router.back()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.preview}>
          {sealed ? (
            <View style={styles.sealed}>
              <SealMark size={120} />
              <Text style={styles.sealedTitle}>Cápsula cerrada</Text>
              <Text style={styles.sealedBody}>
                Se abre el {formatDateTime(item.sealedUntil ?? 0)} · {formatCountdown(item.sealedUntil ?? 0)}
              </Text>
            </View>
          ) : item.kind === 'photo' ? (
            <Image source={{ uri }} style={styles.image} contentFit="contain" />
          ) : item.kind === 'video' ? (
            <VideoPreview uri={uri} />
          ) : item.mimeType === 'application/pdf' || item.fileName.toLowerCase().endsWith('.pdf') ? (
            <WebView source={{ uri }} style={styles.pdf} originWhitelist={['*']} allowFileAccess />
          ) : (
            <View style={styles.docPreview}>
              <Glyph name="doc.text.fill" size={36} color={colors.gold} />
              <Text style={styles.docName}>{item.fileName}</Text>
              <Text style={styles.metaLine}>{item.mimeType}</Text>
            </View>
          )}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          onBlur={saveMeta}
          style={styles.titleInput}
          placeholder="Título"
          placeholderTextColor={colors.inkFaint}
        />
        <TextInput
          value={note}
          onChangeText={setNote}
          onBlur={saveMeta}
          style={styles.noteInput}
          placeholder="Nota privada para este sello"
          placeholderTextColor={colors.inkFaint}
          multiline
        />

        <View style={styles.card}>
          <Meta label="Archivo" value={item.fileName} />
          <Meta label="Tamaño" value={formatBytes(item.size)} />
          <Meta label="Sellado" value={formatDateTime(item.createdAt)} />
          <Pressable onPress={copyFp}>
            <Meta
              label={`Huella ${item.fingerprintAlg.toUpperCase()}`}
              value={shortenFingerprint(item.fingerprint)}
            />
          </Pressable>
        </View>

        {verify === 'ok' ? <Text style={styles.ok}>El sello coincide. El archivo no ha sido alterado.</Text> : null}
        {verify === 'bad' ? <Text style={styles.bad}>El sello no coincide. El archivo pudo haberse alterado.</Text> : null}

        {!sealed ? (
          <Button title="Verificar huella" variant="ink" onPress={onVerify} loading={busy} />
        ) : null}
        <View style={{ height: 10 }} />
        {!sealed ? (
          <Button
            title={item.kind === 'document' ? 'Exportar a Archivos' : 'Devolver a Fotos'}
            variant="ghost"
            onPress={onExport}
            loading={busy}
          />
        ) : null}
        <View style={{ height: 10 }} />
        <Button title="Borrar sello" variant="danger" onPress={onDelete} disabled={busy} />
      </ScrollView>
    </SafeAreaView>
  );
}

function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
  });
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" />;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  missing: { color: colors.inkMuted, fontFamily: fonts.sans, textAlign: 'center', marginTop: 40 },
  preview: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    minHeight: 240,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 18,
  },
  image: { width: '100%', height: 360, backgroundColor: colors.bg },
  video: { width: '100%', height: 280, backgroundColor: colors.bg },
  pdf: { height: 420, backgroundColor: colors.bg },
  sealed: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 10 },
  sealedTitle: { fontFamily: fonts.serif, color: colors.ink, fontSize: 28 },
  sealedBody: { fontFamily: fonts.sans, color: colors.goldSoft, textAlign: 'center', paddingHorizontal: 20 },
  docPreview: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  docName: { fontFamily: fonts.sansSemi, color: colors.ink, fontSize: 16, textAlign: 'center', paddingHorizontal: 16 },
  titleInput: {
    fontFamily: fonts.serif,
    fontSize: 32,
    color: colors.ink,
    paddingVertical: 6,
  },
  noteInput: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.inkMuted,
    minHeight: 72,
    marginBottom: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  metaRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  metaLabel: { fontFamily: fonts.sansMedium, color: colors.inkFaint, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  metaValue: { fontFamily: fonts.sans, color: colors.ink, fontSize: 15, marginTop: 4 },
  metaLine: { fontFamily: fonts.sans, color: colors.inkMuted },
  ok: { color: colors.success, fontFamily: fonts.sans, marginBottom: 12, textAlign: 'center' },
  bad: { color: colors.danger, fontFamily: fonts.sans, marginBottom: 12, textAlign: 'center' },
});
