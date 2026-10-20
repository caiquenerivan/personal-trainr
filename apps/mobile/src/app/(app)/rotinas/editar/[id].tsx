import { useLocalSearchParams } from 'expo-router';
import { RoutineBuilderScreen } from '../../../../features/trainer/RoutineBuilderScreen';

export default function EditarRotinaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RoutineBuilderScreen routineId={id} />;
}
