import { useAuth } from '../../stores/auth';
import { TrainerDashboardScreen } from '../../features/trainer/TrainerDashboardScreen';
import { WorkoutDashboard } from '../../features/workout/WorkoutDashboard';

export default function PainelScreen() {
  const role = useAuth((s) => s.user?.role);
  return role === 'TRAINER' ? <TrainerDashboardScreen /> : <WorkoutDashboard variant="student" />;
}
