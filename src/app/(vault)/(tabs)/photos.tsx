import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { EmptyState } from '../../../components/EmptyState';
import { PhotoTile } from '../../../components/ItemCard';
import { VaultHeader } from '../../../components/VaultHeader';
import { useSession } from '../../../context/SessionContext';
import { colors } from '../../../theme';

export default function PhotosScreen() {
  const { items, lock, fileUriFor } = useSession();
  const photos = items.filter((item) => item.kind === 'photo');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.pad}>
        <VaultHeader
          title="Fotos"
          subtitle={`${photos.length} selladas`}
          onSearch={() => router.push('/search')}
          onLock={lock}
          action={{ icon: 'plus', onPress: () => router.push('/import') }}
        />
      </View>
      {photos.length === 0 ? (
        <EmptyState
          icon="photo.fill"
          title="Ningún negativo"
          body="Importa desde la galería o dispara con la cámara. Las fotos no salen de este teléfono."
        />
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <PhotoTile item={item} uri={fileUriFor(item)} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pad: { paddingHorizontal: 20 },
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  row: { gap: 6, marginBottom: 6 },
});
