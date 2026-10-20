import { Stack } from 'expo-router';
import { colors } from '../../../theme';

export default function ProgressoLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.panel } }} />;
}
