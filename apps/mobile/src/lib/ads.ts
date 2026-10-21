import { kvStorage } from './kvStorage';

type AdsModule = typeof import('react-native-google-mobile-ads');

// Módulo nativo só existe em builds feitos depois do SDK de anúncios.
function loadModule(): AdsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional (ver acima)
    return require('react-native-google-mobile-ads') as AdsModule;
  } catch {
    return null;
  }
}

const Ads = loadModule();

// Em desenvolvimento, anúncios de teste do Google. Em produção, só com o ID
// real do AdMob configurado — nunca anúncio de teste no app da loja.
const UNIT_ID = __DEV__ ? Ads?.TestIds.INTERSTITIAL : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID;

const MIN_INTERVAL_MS = 3 * 60 * 1000; // no máximo um anúncio a cada 3 minutos
const LAST_SHOWN_KEY = 'personaltrainr.ads.lastShown';

let interstitial: ReturnType<AdsModule['InterstitialAd']['createForAdRequest']> | null = null;
let loaded = false;
let started = false;

// Inicia o SDK e deixa um anúncio pré-carregado. Só para alunos do plano
// grátis (quem chama decide).
export function startAds() {
  if (!Ads || !UNIT_ID || started) return;
  started = true;
  Ads.default()
    .initialize()
    .then(() => {
      interstitial = Ads.InterstitialAd.createForAdRequest(UNIT_ID);
      interstitial.addAdEventListener(Ads.AdEventType.LOADED, () => {
        loaded = true;
      });
      interstitial.addAdEventListener(Ads.AdEventType.CLOSED, () => {
        loaded = false;
        interstitial?.load();
      });
      interstitial.addAdEventListener(Ads.AdEventType.ERROR, () => {
        loaded = false;
      });
      interstitial.load();
    })
    .catch(() => {
      started = false;
    });
}

// Ao abrir um exercício: mostra o anúncio se houver um pronto e o intervalo
// mínimo já passou. Nunca segura a abertura do exercício.
export function maybeShowExerciseAd() {
  if (!interstitial || !loaded) return;
  const last = Number(kvStorage.getItem(LAST_SHOWN_KEY) ?? 0);
  if (Date.now() - last < MIN_INTERVAL_MS) return;
  kvStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
  interstitial.show().catch(() => {});
}
