import { Platform } from 'react-native';
import { kvStorage } from './kvStorage';
import { usePremium } from '../stores/premium';

type IapModule = typeof import('expo-iap');

export const NO_ADS_SKU = 'sem_anuncios_mensal';
const PACKAGE = 'club.personaltrainr.app';

// Módulo nativo só existe em builds feitos depois do expo-iap; sem ele (build
// antigo, web) o aluno simplesmente fica no plano grátis.
function loadModule(): IapModule | null {
  if (Platform.OS !== 'android') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional (ver acima)
    return require('expo-iap') as IapModule;
  } catch {
    return null;
  }
}

const Iap = loadModule();
export const isBillingAvailable = Iap !== null;

const cacheKey = (userId: string) => `personaltrainr.premium.${userId}`;
let connected: Promise<boolean> | null = null;

function connect(): Promise<boolean> {
  if (!Iap) return Promise.resolve(false);
  connected ??= Iap.initConnection().then(
    () => true,
    () => {
      connected = null;
      return false;
    },
  );
  return connected;
}

function setPremium(userId: string, isPremium: boolean) {
  kvStorage.setItem(cacheKey(userId), isPremium ? '1' : '0');
  usePremium.getState().set({ isPremium });
}

// A assinatura fica presa à conta Google do aparelho; o id do usuário vai
// como obfuscatedAccountId na compra para ela valer só para quem comprou.
function isMine(purchase: { productId: string; purchaseState: string; obfuscatedAccountIdAndroid?: string | null }, userId: string) {
  return (
    purchase.productId === NO_ADS_SKU &&
    purchase.purchaseState === 'purchased' &&
    (!purchase.obfuscatedAccountIdAndroid || purchase.obfuscatedAccountIdAndroid === userId)
  );
}

// Ao entrar: primeiro o que está salvo no aparelho (vale sem internet), depois
// confere com a Play e confirma compras ainda não confirmadas (sem isso a
// Play estorna a compra em 3 dias).
export async function refreshEntitlement(userId: string): Promise<void> {
  usePremium.getState().set({ isPremium: kvStorage.getItem(cacheKey(userId)) === '1' });
  if (!Iap || !(await connect())) return;
  try {
    const purchases = await Iap.getAvailablePurchases();
    const mine = purchases.filter((p) => isMine(p, userId));
    for (const purchase of mine) {
      if (!('isAcknowledgedAndroid' in purchase) || !purchase.isAcknowledgedAndroid) {
        await Iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
      }
    }
    setPremium(userId, mine.length > 0);

    const products = await Iap.fetchProducts({ skus: [NO_ADS_SKU], type: 'subs' });
    const offer = (products?.[0] as { subscriptionOffers?: { displayPrice: string }[] } | undefined)?.subscriptionOffers?.[0];
    if (offer) usePremium.getState().set({ price: offer.displayPrice });
  } catch {
    // sem conexão com a Play: fica o valor salvo no aparelho
  }
}

// Escuta o resultado das compras (chega por evento, não pelo retorno).
export function listenToPurchases(userId: string, onError: (message: string) => void): () => void {
  if (!Iap) return () => {};
  const updated = Iap.purchaseUpdatedListener(async (purchase) => {
    if (!isMine(purchase, userId)) return;
    await Iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
    setPremium(userId, true);
  });
  const failed = Iap.purchaseErrorListener((error) => {
    if (String(error.code).toLowerCase().includes('cancel')) return;
    onError('Não foi possível concluir a assinatura. Tente de novo.');
  });
  return () => {
    updated.remove();
    failed.remove();
  };
}

export async function buyNoAds(userId: string): Promise<void> {
  if (!Iap || !(await connect())) throw new Error('Compras indisponíveis neste aparelho');
  const products = await Iap.fetchProducts({ skus: [NO_ADS_SKU], type: 'subs' });
  const offer = (products?.[0] as { subscriptionOffers?: { offerTokenAndroid?: string | null }[] } | undefined)
    ?.subscriptionOffers?.find((o) => o.offerTokenAndroid);
  if (!offer?.offerTokenAndroid) throw new Error('Plano indisponível no momento');
  await Iap.requestPurchase({
    type: 'subs',
    request: {
      google: {
        skus: [NO_ADS_SKU],
        subscriptionOffers: [{ sku: NO_ADS_SKU, offerToken: offer.offerTokenAndroid }],
        obfuscatedAccountId: userId,
      },
    },
  });
}

export async function manageSubscription(): Promise<void> {
  if (!Iap) return;
  await Iap.deepLinkToSubscriptions({ skuAndroid: NO_ADS_SKU, packageNameAndroid: PACKAGE });
}

export function clearPremium() {
  usePremium.getState().set({ isPremium: false });
}
