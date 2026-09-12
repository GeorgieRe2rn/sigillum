import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { EmptyState } from '../../../components/EmptyState';
import { ItemCard } from '../../../components/ItemCard';
import { VaultHeader } from '../../../components/VaultHeader';
import { useSession } from '../../../context/SessionContext';
import { colors } from '../../../theme';

export default function DocumentsScreen() {
  const { items, lock, fileUriFor } = useSession();
  const docs = items.filter((item) => item.kind === 'document');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.pad}>
        <VaultHeader
          title="Documentos"
          subtitle={`${docs.length} sellados`}
          onSearch={() => router.push('/search')}
          onLock={lock}
          action={{ icon: 'plus', onPress: () => router.push('/import') }}
        />
      </View>
      {docs.length === 0 ? (
        <EmptyState
          icon="doc.fill"
          title="El protocolo está vacío"
          body="PDFs, contratos, pasaportes, escrituras. Lo que no debería vivir en la fototeca."
        />
      ) : (
        <FlatList
          data={docs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ItemCard item={item} uri={fileUriFor(item)} onPress={() => router.push(`/item/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
});
