import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { accountApi, getErrorMessage } from '../../lib/api';
import { clearUserWorkoutData } from '../../lib/workoutQueue';
import { useActiveWorkoutStore } from '../../stores/activeWorkout';
import { useAuth } from '../../stores/auth';
import { Alert } from '../../components/Alert';
import { AppModal } from '../../components/AppModal';
import { Button } from '../../components/Button';
import { Text } from '../../components/Text';
import { TextField } from '../../components/TextField';
import { colors, fonts } from '../../theme';

const CONFIRMATION = 'EXCLUIR';

// Exclusão da própria conta, exigida pelas lojas: explica o que será
// apagado, pede a palavra de confirmação e a senha (se a conta tiver).
export function DeleteAccountModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setConfirmation('');
    setPassword('');
    setError(null);
    onClose();
  }

  async function submit() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      await accountApi.deleteAccount(confirmation, password || undefined);
      clearUserWorkoutData(user.id);
      useActiveWorkoutStore.getState().forget(user.id);
      close();
      await signOut();
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível excluir a conta.'));
    } finally {
      setLoading(false);
    }
  }

  const isTrainer = user?.role === 'TRAINER';

  return (
    <AppModal open={open} onClose={close} title="Excluir conta">
      <Text style={styles.lead}>Esta ação é permanente e não pode ser desfeita. Serão apagados:</Text>
      <View style={styles.list}>
        <Text style={styles.item}>• seus dados de perfil e foto</Text>
        <Text style={styles.item}>• seu histórico de treinos e de cargas</Text>
        <Text style={styles.item}>• seus vínculos com {isTrainer ? 'alunos' : 'personais'} e avaliações</Text>
        {isTrainer && <Text style={styles.item}>• suas rotinas e exercícios próprios (os alunos deixam de ter essas rotinas)</Text>}
        {isTrainer && <Text style={styles.item}>• sua assinatura, que é cancelada</Text>}
      </View>

      <TextField
        label={`Digite ${CONFIRMATION} para confirmar`}
        value={confirmation}
        onChangeText={setConfirmation}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      <TextField
        label="Sua senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="current-password"
        placeholder="Se você entra com Google, deixe em branco"
      />

      {error && <Alert>{error}</Alert>}

      <Button
        title="Excluir minha conta"
        variant="danger"
        onPress={submit}
        loading={loading}
        disabled={confirmation.trim().toUpperCase() !== CONFIRMATION}
      />
      <Button title="Cancelar" variant="outline" onPress={close} />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  lead: { lineHeight: 20 },
  list: { gap: 4 },
  item: { fontSize: 13, lineHeight: 19, color: colors.textSecondary, fontFamily: fonts.body },
});
