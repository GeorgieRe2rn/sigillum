import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../theme';

export default function NotFound() {
  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ headerShown: false }} />
      <Text style={styles.title}>Esa ruta no existe</Text>
      <Link href="/" style={styles.link}>
        Volver al sello
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontFamily: fonts.serif, color: colors.ink, fontSize: 28, marginBottom: 12 },
  link: { fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 16 },
});
