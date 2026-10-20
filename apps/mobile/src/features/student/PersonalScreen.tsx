import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Globe, Hash, MessageCircle, Phone, ShieldCheck, Trash2, User } from 'lucide-react-native';
import type { LinkedTrainer } from '@personaltrainr/shared';
import { connectionApi, getErrorMessage } from '../../lib/api';
import { normalize } from '../../lib/format';
import { useAuth } from '../../stores/auth';
import { showToast } from '../../stores/toast';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PageHeader } from '../../components/PageHeader';
import { ScrollScreen } from '../../components/ScrollScreen';
import { SearchInput } from '../../components/SearchInput';
import { StarRating } from '../../components/StarRating';
import { Text } from '../../components/Text';
import { colors, fonts, radius } from '../../theme';

const specialties = (value: string | null) => (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);
const instagramUrl = (value: string) => {
  const clean = value.replace(/^@/, '').trim();
  return clean.startsWith('http') ? clean : `https://instagram.com/${clean}`;
};
const whatsappUrl = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// Tela "Personal" do aluno (/aluno/personal no web).
export function PersonalScreen() {
  const userId = useAuth((s) => s.user?.id);
  const queryClient = useQueryClient();
  const myTrainersKey = ['student', userId, 'my-trainers'];
  const myTrainers = useQuery({ queryKey: myTrainersKey, queryFn: () => connectionApi.getMyTrainers() });
  const linked = myTrainers.data?.[0] ?? null;
  const trainers = useQuery({
    queryKey: ['student', userId, 'trainers'],
    queryFn: () => connectionApi.listTrainers(),
    enabled: myTrainers.isSuccess && !linked,
  });
  const [search, setSearch] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['student', userId] });

  const connect = useMutation({
    mutationFn: (trainerId: string) => connectionApi.connect(trainerId),
    onSuccess: () => {
      showToast('Personal vinculado com sucesso!');
      refresh();
    },
    onError: (err) => showToast(getErrorMessage(err, 'Erro ao conectar')),
  });

  const remove = useMutation({
    mutationFn: (connectionId: string) => connectionApi.removeConnection(connectionId),
    onSuccess: () => {
      showToast('Conexão removida com sucesso');
      setConfirmRemove(false);
      refresh();
    },
    onError: (err) => showToast(getErrorMessage(err, 'Erro ao remover')),
  });

  const rate = useMutation({
    mutationFn: ({ trainerId, rating }: { trainerId: string; rating: number }) => connectionApi.rateTrainer(trainerId, rating),
    onMutate: ({ rating }) => {
      queryClient.setQueryData<LinkedTrainer[]>(myTrainersKey, (prev) => prev?.map((t, i) => (i === 0 ? { ...t, myRating: rating } : t)));
    },
    onSuccess: () => {
      showToast('Avaliação enviada com sucesso!');
      refresh();
    },
    onError: (err) => {
      showToast(getErrorMessage(err, 'Erro ao enviar avaliação'));
      refresh();
    },
  });

  const q = normalize(search.trim());
  const results = (trainers.data ?? []).filter((t) => !q || normalize(`${t.name} ${t.username ?? ''}`).includes(q));

  return (
    <ScrollScreen
      onRefresh={() => {
        refresh();
      }}
      refreshing={myTrainers.isRefetching}
    >
      <PageHeader title="Meu Personal" />

      {myTrainers.isPending ? (
        <Text style={styles.muted}>Carregando informações...</Text>
      ) : linked ? (
        <Card style={styles.card}>
          <View style={styles.badge}>
            <ShieldCheck size={12} color={colors.accent} />
            <Text style={styles.badgeText}>Personal vinculado</Text>
          </View>
          <View style={styles.top}>
            <Avatar name={linked.name} url={linked.avatarUrl} size={64} />
            <View style={styles.flex}>
              <Text variant="title" style={styles.name}>
                {linked.name}
              </Text>
              {linked.username && <Text style={styles.muted}>@{linked.username}</Text>}
              <View style={styles.ratingRow}>
                <StarRating value={linked.avgRating ?? 0} size={16} />
                <Text style={styles.small}>
                  {linked.avgRating != null ? linked.avgRating.toFixed(1) : '—'} ({linked.ratingCount})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.block}>
            <Text variant="label">Sua avaliação</Text>
            <StarRating value={linked.myRating ?? 0} size={28} onChange={(rating) => rate.mutate({ trainerId: linked.id, rating })} />
          </View>

          {linked.cref && (
            <Info icon={<Hash size={16} color={colors.accent} />}>
              CREF: <Text style={styles.strong}>{linked.cref}</Text>
              {linked.crefState ? ` — ${linked.crefState}` : ''}
            </Info>
          )}
          {specialties(linked.especialidades).length > 0 && (
            <View style={styles.tags}>
              {specialties(linked.especialidades).map((spec) => (
                <Text key={spec} style={styles.tag}>
                  {spec}
                </Text>
              ))}
            </View>
          )}
          {linked.bio && <Text style={styles.bio}>{linked.bio}</Text>}

          {linked.phone && (
            <LinkRow icon={<Phone size={16} color={colors.accent} />} label={linked.phone} url={whatsappUrl(linked.phone)} />
          )}
          {linked.instagram && (
            <LinkRow icon={<Camera size={16} color={colors.accent} />} label={linked.instagram} url={instagramUrl(linked.instagram)} />
          )}
          {linked.website && (
            <LinkRow
              icon={<Globe size={16} color={colors.accent} />}
              label={linked.website}
              url={linked.website.startsWith('http') ? linked.website : `https://${linked.website}`}
            />
          )}

          {linked.phone && (
            <Button
              title="Pedir ajuste no treino"
              icon={<MessageCircle size={16} color={colors.black} />}
              onPress={() => Linking.openURL(whatsappUrl(linked.phone!, 'Olá, gostaria de ajuste no meu treino!'))}
            />
          )}
          <Button
            title="Remover conexão"
            variant="outline"
            icon={<Trash2 size={16} color={colors.textPrimary} />}
            onPress={() => setConfirmRemove(true)}
          />
        </Card>
      ) : (
        <>
          <Card style={styles.emptyCard}>
            <User size={40} color={colors.border} />
            <Text variant="title" style={styles.emptyTitle}>
              Nenhum Personal Vinculado
            </Text>
            <Text style={styles.emptyText}>
              Encontre um personal abaixo e vincule-se para receber seus treinos.
            </Text>
          </Card>
          <SearchInput value={search} onChangeText={setSearch} placeholder="Filtrar por nome ou @username..." />
          {trainers.isPending ? (
            <Text style={styles.muted}>Carregando personais...</Text>
          ) : results.length === 0 ? (
            <Text style={styles.muted}>
              {search.trim() ? `Nenhum personal encontrado para "${search.trim()}"` : 'Nenhum personal disponível no momento.'}
            </Text>
          ) : (
            results.map((trainer) => (
              <Card key={trainer.id} style={styles.card}>
                <View style={styles.top}>
                  <Avatar name={trainer.name} url={trainer.avatarUrl} size={52} />
                  <View style={styles.flex}>
                    <Text variant="title" style={styles.listName}>
                      {trainer.name}
                    </Text>
                    <Text style={styles.small}>@{trainer.username}</Text>
                    <View style={styles.ratingRow}>
                      <StarRating value={trainer.avgRating ?? 0} size={12} />
                      <Text style={styles.tiny}>({trainer.ratingCount})</Text>
                    </View>
                  </View>
                </View>
                {specialties(trainer.especialidades).length > 0 && (
                  <View style={styles.tags}>
                    {specialties(trainer.especialidades).map((spec) => (
                      <Text key={spec} style={styles.tag}>
                        {spec}
                      </Text>
                    ))}
                  </View>
                )}
                {trainer.bio && (
                  <Text style={styles.bio} numberOfLines={3}>
                    {trainer.bio}
                  </Text>
                )}
                <Button
                  title="Vincular"
                  onPress={() => connect.mutate(trainer.id)}
                  loading={connect.isPending && connect.variables === trainer.id}
                />
              </Card>
            ))
          )}
        </>
      )}

      <ConfirmModal
        open={confirmRemove}
        title="Remover conexão"
        itemName={`a conexão com ${linked?.name ?? ''}`}
        confirmLabel="Remover"
        loading={remove.isPending}
        onConfirm={() => linked && remove.mutate(linked.connectionId)}
        onClose={() => setConfirmRemove(false)}
      />
    </ScrollScreen>
  );
}

function Info({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.info}>
      {icon}
      <Text style={styles.infoText}>{children}</Text>
    </View>
  );
}

function LinkRow({ icon, label, url }: { icon: React.ReactNode; label: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} style={styles.info} accessibilityRole="link">
      {icon}
      <Text style={[styles.infoText, styles.link]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0, gap: 2 },
  muted: { color: colors.textSecondary },
  small: { fontSize: 12, color: colors.textSecondary },
  tiny: { fontSize: 10, color: colors.textSecondary },
  strong: { fontFamily: fonts.bodyBold },
  card: { gap: 14, padding: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(175,145,80,0.3)',
    backgroundColor: 'rgba(175,145,80,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: { fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', color: colors.accent },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 22 },
  listName: { fontSize: 17 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  block: { gap: 8 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 32 },
  infoText: { flex: 1, color: colors.textSecondary },
  link: { color: colors.textPrimary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(74,74,74,0.4)',
    backgroundColor: colors.base,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  bio: { fontSize: 14, lineHeight: 21, color: colors.textSecondary },
  emptyCard: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyTitle: { fontSize: 18, textAlign: 'center' },
  emptyText: { textAlign: 'center', color: colors.textSecondary, lineHeight: 20 },
});
