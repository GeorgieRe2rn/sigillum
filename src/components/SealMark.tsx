import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function SealMark({ size = 168 }: { size?: number }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 6 }]}>
      <Image
        source={require('../../assets/seal.png')}
        style={{ width: size, height: size }}
        contentFit="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
});
