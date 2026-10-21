import { create } from 'zustand';

// Assinatura "Sem anúncios" do aluno (Google Play Billing).
type PremiumState = {
  isPremium: boolean;
  // preço como a loja mostra (ex.: "R$ 10,99"); null enquanto não carregou
  price: string | null;
  set: (patch: Partial<Pick<PremiumState, 'isPremium' | 'price'>>) => void;
};

export const usePremium = create<PremiumState>((set) => ({
  isPremium: false,
  price: null,
  set: (patch) => set(patch),
}));
