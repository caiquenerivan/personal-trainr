import { api } from '../api/client';
import { createConnection } from '../api/connections';

// Completa a conexão trainer<->aluno de um convite pendente (guardado pela
// página /convite/:username) assim que o aluno entra, por senha ou Google.
// Falha silenciosamente: o aluno ainda pode se conectar manualmente depois.
export async function completePendingInvite() {
  const storedInvite = localStorage.getItem('@ptrainr:invite');
  if (!storedInvite) return;
  try {
    const inviteRes = await api.get(`/api/trainers/invite/${storedInvite}`);
    const trainerId = inviteRes.data.trainer.id;
    await createConnection(trainerId);
  } catch {
    // convite pode ter expirado ou já ter sido usado — ignora
  } finally {
    localStorage.removeItem('@ptrainr:invite');
  }
}
