import Constants, { ExecutionEnvironment } from 'expo-constants';
import { GOOGLE_WEB_CLIENT_ID } from './config';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');

// O módulo nativo do Google não existe no Expo Go; carregá-lo lá derruba o
// app. Só tenta em development/production build e com o client ID definido.
function loadModule(): GoogleSignInModule | null {
  if (!GOOGLE_WEB_CLIENT_ID) return null;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional (ver acima)
    return require('@react-native-google-signin/google-signin') as GoogleSignInModule;
  } catch {
    return null;
  }
}

const googleModule = loadModule();
googleModule?.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export const isGoogleSignInAvailable = googleModule !== null;

// null = usuário cancelou.
export async function getGoogleIdToken(): Promise<string | null> {
  if (!googleModule) throw new Error('Login com Google indisponível neste build');
  const { GoogleSignin, isSuccessResponse } = googleModule;

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  if (!response.data.idToken) throw new Error('Google não retornou idToken');
  return response.data.idToken;
}

export async function signOutFromGoogle(): Promise<void> {
  await googleModule?.GoogleSignin.signOut().catch(() => {});
}
