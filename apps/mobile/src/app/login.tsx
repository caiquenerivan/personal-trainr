import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextInputInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AxiosError } from 'axios';
import Svg, { Path } from 'react-native-svg';
import { isTwoFactorChallenge, type LoginResponse } from '@personaltrainr/shared';
import { authApi, getErrorMessage } from '../lib/api';
import { WEB_URL } from '../lib/config';
import { getGoogleIdToken, isGoogleSignInAvailable } from '../lib/googleSignIn';
import { useAuth } from '../stores/auth';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import { TextField } from '../components/TextField';
import { colors, radius } from '../theme';

type Status = 'idle' | 'loading' | 'unverified';

function GoogleIcon() {
  return (
    <Svg viewBox="0 0 24 24" width={18} height={18}>
      <Path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <Path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.29A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09z" />
      <Path fill="#EA4335" d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.63l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </Svg>
  );
}

export default function LoginScreen() {
  const signIn = useAuth((s) => s.signIn);
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent'>('idle');

  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  async function finishLogin(response: LoginResponse) {
    if (isTwoFactorChallenge(response)) {
      setTempToken(response.tempToken);
      return;
    }
    // Admin exige 2FA e só tem telas no web; o app é para personal e aluno.
    if (response.user.role === 'ADMIN') {
      if (response.refreshToken) authApi.logout(response.refreshToken).catch(() => {});
      setError('Contas de administrador acessam pelo site.');
      return;
    }
    await signIn(response);
  }

  async function handleSubmit() {
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setStatus('loading');
    setError(null);
    try {
      const response = await authApi.login({ email: email.trim(), password, client: 'mobile' });
      await finishLogin(response);
      setStatus('idle');
    } catch (err) {
      const message = err instanceof AxiosError ? String(err.response?.data?.message ?? '') : '';
      if (err instanceof AxiosError && err.response?.status === 403 && message.includes('Confirme seu e-mail')) {
        setStatus('unverified');
        return;
      }
      setStatus('idle');
      setError(
        err instanceof AxiosError && err.response?.status === 401
          ? 'Não foi possível autenticar com essas credenciais.'
          : getErrorMessage(err, 'Não foi possível autenticar com essas credenciais.'),
      );
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      await finishLogin(await authApi.googleMobile(idToken));
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível entrar com o Google.'));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleVerifyTwoFactor() {
    if (!tempToken) return;
    setTwoFactorLoading(true);
    setError(null);
    try {
      await finishLogin(await authApi.verifyTwoFactor(tempToken, twoFactorCode, 'mobile'));
    } catch (err) {
      setError(
        err instanceof AxiosError && err.response?.status === 401
          ? 'Código inválido. Tente novamente.'
          : getErrorMessage(err, 'Código inválido. Tente novamente.'),
      );
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendStatus('loading');
    try {
      await authApi.resendVerification(email.trim());
      setResendStatus('sent');
    } catch {
      setResendStatus('idle');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {tempToken ? (
            <View style={styles.card}>
              <Text variant="title">Verificação em duas etapas</Text>
              <Text style={styles.description}>
                Digite o código de 6 dígitos do seu app autenticador, ou um código de backup.
              </Text>

              <View style={styles.fields}>
                <TextField
                  label="Código"
                  value={twoFactorCode}
                  onChangeText={(v) => setTwoFactorCode(v.trim())}
                  keyboardType="number-pad"
                  autoFocus
                  textContentType="oneTimeCode"
                  autoComplete="one-time-code"
                  style={styles.codeInput}
                  onSubmitEditing={handleVerifyTwoFactor}
                />
              </View>

              {error && <Alert>{error}</Alert>}

              <Button title="Confirmar" onPress={handleVerifyTwoFactor} loading={twoFactorLoading} />

              <Pressable
                onPress={() => {
                  setTempToken(null);
                  setTwoFactorCode('');
                  setError(null);
                }}
                style={styles.linkButton}
              >
                <Text style={styles.backLink}>Voltar para o login</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text variant="title" style={styles.brand}>
                Personal Trainr
              </Text>

              <View style={styles.fields}>
                <TextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
                <TextField
                  ref={passwordRef}
                  label="Senha"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                />
                <Pressable
                  onPress={() => Linking.openURL(`${WEB_URL}/esqueci-senha`)}
                  style={styles.forgot}
                  hitSlop={8}
                >
                  <Text style={styles.link}>Esqueci minha senha</Text>
                </Pressable>
              </View>

              {error && <Alert>{error}</Alert>}

              {status === 'unverified' && (
                <Alert
                  action={
                    resendStatus === 'sent' ? (
                      <Text style={styles.secondary}>Email reenviado. Verifique sua caixa de entrada (e spam).</Text>
                    ) : (
                      <Pressable onPress={handleResendVerification} disabled={resendStatus === 'loading'}>
                        <Text style={styles.resend}>
                          {resendStatus === 'loading' ? 'Enviando...' : 'Reenviar e-mail de confirmação'}
                        </Text>
                      </Pressable>
                    )
                  }
                >
                  Confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.
                </Alert>
              )}

              <Button title="Entrar" onPress={handleSubmit} loading={status === 'loading'} />

              {isGoogleSignInAvailable && (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <Button
                    title="Continuar com Google"
                    variant="outline"
                    onPress={handleGoogle}
                    loading={googleLoading}
                    icon={<GoogleIcon />}
                  />
                </>
              )}

              <View style={styles.signup}>
                <Text style={styles.secondary}>Não tem uma conta? </Text>
                <Pressable onPress={() => Linking.openURL(`${WEB_URL}/cadastro`)} hitSlop={8}>
                  <Text style={[styles.link, styles.signupLink]}>Cadastre-se</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24 },
  card: { gap: 20, borderRadius: radius['2xl'], backgroundColor: colors.card, padding: 32 },
  brand: { fontSize: 30 },
  description: { color: colors.textSecondary },
  fields: { gap: 20, marginTop: 12 },
  codeInput: { textAlign: 'center', fontSize: 18, letterSpacing: 6 },
  forgot: { alignSelf: 'flex-end' },
  link: { fontSize: 12, color: colors.accent, textDecorationLine: 'underline' },
  linkButton: { alignSelf: 'center', paddingVertical: 4 },
  backLink: { fontSize: 12, textTransform: 'uppercase', color: colors.textSecondary, textDecorationLine: 'underline' },
  resend: { fontSize: 12, textTransform: 'uppercase', color: colors.accent, textDecorationLine: 'underline' },
  secondary: { color: colors.textSecondary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: 10, textTransform: 'uppercase', color: colors.textSecondary },
  signup: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap' },
  signupLink: { fontSize: 14 },
});
