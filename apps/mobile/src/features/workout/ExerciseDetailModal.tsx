import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import type { RoutineExercise } from '@personaltrainr/shared';
import { AppModal } from '../../components/AppModal';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

export function ExerciseDetailModal({ item, onClose }: { item: RoutineExercise | null; onClose: () => void }) {
  const exercise = item?.exercise;
  return (
    <AppModal open={!!item} onClose={onClose} title="Detalhes do Exercício">
      {exercise && (
        <>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>Exercício</Text>
            <Text variant="title" style={styles.name}>
              {exercise.name}
            </Text>
            {exercise.muscle && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>Grupo Muscular: {exercise.muscle}</Text>
              </View>
            )}
          </View>

          {exercise.gifUrl && (
            <View style={styles.media}>
              <Image
                source={{ uri: exercise.gifUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="contain"
                cachePolicy="disk"
                autoplay
                accessibilityLabel={`Animação do exercício ${exercise.name}`}
              />
            </View>
          )}

          {item && (
            <View style={styles.prescription}>
              <Text style={styles.metric}>{item.series} séries</Text>
              <Text style={styles.metric}>{item.reps} reps</Text>
              <Text style={styles.metric}>{item.restTime}s descanso</Text>
            </View>
          )}

          {exercise.observations && (
            <View style={styles.obs}>
              <Text style={styles.obsLabel}>Observações & Instruções</Text>
              <Text style={styles.obsText}>{exercise.observations}</Text>
            </View>
          )}
        </>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  header: { gap: 6 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: colors.accent },
  name: { fontSize: 20 },
  chip: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase' },
  media: {
    aspectRatio: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.6)',
    backgroundColor: colors.base,
    overflow: 'hidden',
  },
  prescription: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metric: { fontFamily: fonts.number, fontSize: 13, color: colors.accent },
  obs: { gap: 6 },
  obsLabel: { fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 2, color: colors.textSecondary },
  obsText: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.base,
    paddingHorizontal: 16,
    paddingVertical: 12,
    lineHeight: 20,
  },
});
