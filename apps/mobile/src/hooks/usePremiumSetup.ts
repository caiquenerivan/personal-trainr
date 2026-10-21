import { useEffect } from 'react';
import { listenToPurchases, refreshEntitlement } from '../lib/billing';
import { startAds } from '../lib/ads';
import { useAuth } from '../stores/auth';
import { usePremium } from '../stores/premium';
import { showToast } from '../stores/toast';

// Assinatura Sem Anúncios e anúncios do aluno do plano grátis.
export function usePremiumSetup() {
  const user = useAuth((s) => s.user);
  const isPremium = usePremium((s) => s.isPremium);
  const isStudent = user?.role === 'ALUNO';

  useEffect(() => {
    if (!user || !isStudent) return;
    refreshEntitlement(user.id);
    return listenToPurchases(user.id, showToast);
  }, [user, isStudent]);

  useEffect(() => {
    if (isStudent && !isPremium) startAds();
  }, [isStudent, isPremium]);
}
