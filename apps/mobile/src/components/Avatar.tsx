import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius } from '../theme';
import { Text } from './Text';

export function Avatar({ name, url, size = 36 }: { name?: string | null; url?: string | null; size?: number }) {
  const dimension = { width: size, height: size, borderRadius: radius.full };
  if (url) {
    return <Image source={{ uri: url }} style={dimension} contentFit="cover" accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.fallback, dimension]}>
      <Text style={styles.initial}>{name?.charAt(0) ?? '?'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.base },
  initial: { fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary },
});
