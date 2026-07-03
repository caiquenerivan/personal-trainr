export type Student = {
  id: string;
  name: string;
  weight: number;
  height: number;
  birthDate: string;
  objective: string;
  email: string;
  avatarUrl?: string;
  hasActiveRoutine: boolean;
  routineName?: string;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  videoUrl: string;
  gifUrl: string;
  observations: string;
};

export const students: Student[] = [
  { id: 'student-ana-souza', name: 'Ana Souza', weight: 65, height: 1.67, birthDate: '1994-03-15', objective: 'Hipertrofia', email: 'ana.souza@email.com', hasActiveRoutine: true, routineName: 'Hipertrofia Full Body' },
  { id: 'student-carlos-lima', name: 'Carlos Lima', weight: 82, height: 1.75, birthDate: '1990-07-22', objective: 'Emagrecimento', email: 'carlos.lima@email.com', hasActiveRoutine: false },
  { id: 'student-marina-rocha', name: 'Marina Rocha', weight: 58, height: 1.62, birthDate: '1997-11-08', objective: 'Tonificação', email: 'marina.rocha@email.com', hasActiveRoutine: true, routineName: 'Treino Funcional' },
];

export const exercises: Exercise[] = [
  {
    id: 'exercise-squat',
    name: 'Agachamento Livre',
    muscleGroup: 'Pernas',
    videoUrl: '',
    gifUrl: '',
    observations: 'Manter a coluna ereta e joelhos alinhados com os pés.',
  },
  {
    id: 'exercise-bench-press',
    name: 'Supino Reto',
    muscleGroup: 'Peito',
    videoUrl: '',
    gifUrl: '',
    observations: 'Cotovelos em 45 graus, não travar os cotovelos no topo.',
  },
  {
    id: 'exercise-row',
    name: 'Remada Curvada',
    muscleGroup: 'Costas',
    videoUrl: '',
    gifUrl: '',
    observations: 'Puxar a barra em direção ao abdômen, contrair as escápulas.',
  },
  {
    id: 'exercise-shoulder-press',
    name: 'Desenvolvimento',
    muscleGroup: 'Ombros',
    videoUrl: '',
    gifUrl: '',
    observations: 'Elevar a barra acima da cabeça sem arquear a lombar.',
  },
  {
    id: 'exercise-deadlift',
    name: 'Levantamento Terra',
    muscleGroup: 'Posterior',
    videoUrl: '',
    gifUrl: '',
    observations: 'Manter a barra rente ao corpo, costas retas durante todo o movimento.',
  },
];
