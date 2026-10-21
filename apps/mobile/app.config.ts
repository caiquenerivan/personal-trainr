import type { ExpoConfig } from 'expo/config';

// Client ID iOS do Google (formato "com.googleusercontent.apps.<id>"). Sem ele
// o plugin do Google Sign-In não entra no build e o botão do Google some do
// login (o restante do app funciona normal).
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;

// Firebase (FCM) do Android, exigido para receber push remoto: caminho do
// google-services.json. No EAS vem de uma variável do tipo arquivo
// (GOOGLE_SERVICES_JSON). Sem ele o app funciona, só sem push remoto — as
// notificações locais (descanso, lembrete) continuam.
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

// AdMob: sem o ID real (variável no EAS), usa o app de teste do Google — e o
// app não mostra anúncio em produção enquanto não houver o ID do bloco.
const admobAndroidAppId = process.env.ADMOB_ANDROID_APP_ID ?? 'ca-app-pub-3940256099942544~3347511713';
const admobIosAppId = process.env.ADMOB_IOS_APP_ID ?? 'ca-app-pub-3940256099942544~1458002511';

const config: ExpoConfig = {
  name: 'Personal Trainr',
  slug: 'personaltrainr',
  scheme: 'personaltrainr',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#333333',
  ios: {
    bundleIdentifier: 'club.personaltrainr.app',
    supportsTablet: false,
  },
  android: {
    package: 'club.personaltrainr.app',
    adaptiveIcon: {
      backgroundColor: '#262626',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#333333',
        image: './assets/splash-icon.png',
        imageWidth: 180,
      },
    ],
    'expo-secure-store',
    'expo-image',
    'expo-sqlite',
    'expo-iap',
    [
      'react-native-google-mobile-ads',
      { androidAppId: admobAndroidAppId, iosAppId: admobIosAppId },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#AF9150',
        defaultChannel: 'default',
      },
    ],
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, object]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
  },
  owner: 'devnerivan',
  extra: {
    eas: {
      projectId: '01d70e9f-ff71-4d06-bb74-dee019957a71',
    },
  },
};

export default config;
