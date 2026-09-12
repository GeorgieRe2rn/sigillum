import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { EmptyState } from '../../components/EmptyState';
import { ItemCard } from '../../components/ItemCard';
import { VaultHeader } from '../../components/VaultHeader';
import { useSession } from '../../context/SessionContext';
import { colors, fonts, radius } from '../../theme';

export default function SearchScreen() {
  const { items, fileUriFor } = useSession();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.title, item.note, item.fileName, item.mimeType, item.fingerprint]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [items, q]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.pad}>
        <VaultHeader title="Buscar" onBack={() => router.back()} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Título, nota, archivo o huella"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
          autoFocus
          autoCorrect={false}
        />
      </View>
      {results.length === 0 ? (
        <EmptyState icon="magnifyingglass" title="Sin coincidencias" body="Prueba con el nombre del sello o un fragmento de la huella." />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <ItemCard item={item} uri={fileUriFor(item)} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20 },
  input: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
});
