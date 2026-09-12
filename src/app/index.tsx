import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSession } from '../context/SessionContext';
import { colors } from '../theme';

export default function Index() {
  const { hydrated, hasVault, unlocked } = useSession();

  if (!hydrated) {
    return (
      <View style={styles.fill}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  if (!hasVault) return <Redirect href="/onboarding" />;
  if (!unlocked) return <Redirect href="/lock" />;
  return <Redirect href="/(vault)/(tabs)" />;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
});
