import { router, useLocalSearchParams } from 'expo-router';
import { LoadProgressScreen } from '../../../features/progress/LoadProgressScreen';

export default function AlunoCargaScreen() {
  const { alunoId, name } = useLocalSearchParams<{ alunoId: string; name?: string }>();
  return <LoadProgressScreen alunoId={alunoId} studentName={name} onBack={() => router.back()} />;
}
