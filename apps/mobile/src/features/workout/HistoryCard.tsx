import { StyleSheet, View } from 'react-native';
import { Activity, CloudOff } from 'lucide-react-native';
import { Card } from '../../components/Card';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';
import type { HistoryEntry } from './history';

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const VISIBLE = 15;

export function HistoryCard({ entries }: { entries: HistoryEntry[] }) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text variant="title" style={styles.title}>
          Histórico
        </Text>
        <View style={styles.counter}>
          <Text style={styles.counterNumber}>{entries.length}</Text>
          <Text style={styles.counterText}>concluídos</Text>
        </View>
      </View>

      {entries.length === 0 && <Text style={styles.empty}>Nenhum treino concluído ainda.</Text>}

      <View style={styles.list}>
        {entries.slice(0, VISIBLE).map((entry) => {
          const date = new Date(entry.completedAt);
          return (
            <View key={entry.id} style={styles.item}>
              <View style={styles.calendar}>
                <Text style={styles.month}>{MONTHS[date.getMonth()]}</Text>
                <Text style={styles.day}>{String(date.getDate()).padStart(2, '0')}</Text>
              </View>
              <View style={styles.info}>
                <Text numberOfLines={1} style={styles.entryTitle}>
                  {entry.title}
                </Text>
                <View style={styles.detail}>
                  <Activity size={10} color={colors.accent} />
                  <Text style={styles.detailText}>
                    {entry.durationMinutes != null ? `Duração: ${entry.durationMinutes} min · ` : ''}
                    {entry.exerciseCount} {entry.exerciseCount === 1 ? 'exercício' : 'exercícios'}
                  </Text>
                </View>
              </View>
              {entry.pending ? (
                <View style={[styles.badge, styles.badgePending]}>
                  <CloudOff size={10} color={colors.warning} />
                  <Text style={[styles.badgeText, { color: colors.warning }]}>Pendente</Text>
                </View>
              ) : (
                <View style={[styles.badge, styles.badgeDone]}>
                  <Text style={[styles.badgeText, { color: colors.success }]}>Concluído</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74,74,74,0.3)',
  },
  title: { fontSize: 18 },
  counter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.6)',
    backgroundColor: colors.base,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterNumber: { fontFamily: fonts.number, fontSize: 12, color: colors.accent },
  counterText: { fontSize: 11, color: colors.accent },
  empty: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 },
  list: { gap: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.4)',
    backgroundColor: 'rgba(51,51,51,0.2)',
    padding: 12,
  },
  calendar: {
    width: 48,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.8)',
    overflow: 'hidden',
    alignItems: 'stretch',
  },
  month: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: colors.accent,
    textAlign: 'center',
    backgroundColor: colors.base,
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74,74,74,0.6)',
  },
  day: { fontFamily: fonts.number, fontSize: 14, textAlign: 'center', backgroundColor: colors.card, paddingVertical: 4 },
  info: { flex: 1, minWidth: 0, gap: 4 },
  entryTitle: { fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { fontSize: 10, color: colors.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 4, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  badgeDone: { borderColor: 'rgba(74,222,128,0.2)', backgroundColor: 'rgba(74,222,128,0.05)' },
  badgePending: { borderColor: 'rgba(250,204,21,0.3)', backgroundColor: 'rgba(250,204,21,0.08)' },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 },
});
