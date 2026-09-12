import { BlurView } from 'expo-blur';
import { StyleSheet, Text, View } from 'react-native';

import { useSession } from '../context/SessionContext';
import { colors, fonts } from '../theme';
import { SealMark } from './SealMark';

export function PrivacyVeil() {
  const { veil, unlocked } = useSession();
  if (!veil || !unlocked) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <SealMark size={120} />
        <Text style={styles.title}>Sigillum</Text>
        <Text style={styles.body}>El archivo queda velado</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
    gap: 10,
  },
  title: { fontFamily: fonts.serifItalic, fontSize: 36, color: colors.ink },
  body: { fontFamily: fonts.sans, color: colors.inkMuted, letterSpacing: 1.4, textTransform: 'uppercase', fontSize: 11 },
});
