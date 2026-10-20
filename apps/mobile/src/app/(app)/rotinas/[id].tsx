import { useLocalSearchParams } from 'expo-router';
import { RoutineDetailScreen } from '../../../features/trainer/RoutineDetailScreen';

export default function RotinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineDetailScreen id={id} />;
}
