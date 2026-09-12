import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';

export function Screen({
  children,
  scroll,
  style,
  padded = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const body = (
    <View style={[padded && styles.pad, style, { flex: 1 }]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && styles.pad, style, styles.scroll]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20, paddingBottom: 28 },
  scroll: { flexGrow: 1 },
});
