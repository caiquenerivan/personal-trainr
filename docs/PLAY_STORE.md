# Publicação na Google Play

Checklist do que precisa ser feito fora do código para publicar o app
Android. A ordem importa: o Firebase entra no build, então vem antes do
primeiro build de produção.

## Contas diferentes no Google Cloud e na Play Console

Pode: OAuth, Firebase e a Play se ligam pelo pacote
(`club.personaltrainr.app`) e pelo SHA-1 da assinatura, não pelo e-mail.
Tudo do Google Cloud (clients OAuth, Firebase, conta de serviço do envio)
fica no projeto da conta onde as credenciais já foram criadas; na Play
Console basta convidar o e-mail da conta de serviço. Recomendado: adicionar
o e-mail da Play Console como Proprietário no IAM do projeto do Cloud e no
Firebase, para administrar de qualquer um dos dois logins.

A tela de consentimento OAuth precisa estar **Em produção** (em teste, só
os e-mails cadastrados como testadores conseguem entrar com Google).

## 1. Firebase (push remoto no Android)

Sem isso o app funciona, mas não recebe "aluno concluiu treino" nem "nova
rotina". As notificações locais (descanso, lembrete) funcionam sem ele.

1. No [Firebase Console](https://console.firebase.google.com), criar o
   projeto "Personal Trainr" e adicionar um app Android com o pacote
   `club.personaltrainr.app`.
2. Baixar o `google-services.json`.
3. Enviar o arquivo para o EAS como variável do tipo arquivo, no ambiente
   de produção (e de desenvolvimento, para testar):
   ```bash
   cd apps/mobile
   npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --environment development --visibility secret
   ```
   O `app.config.ts` lê essa variável. O arquivo local está no `.gitignore`.
4. No Firebase: Configurações do projeto → Contas de serviço → gerar chave
   privada (JSON). Enviar ao EAS para o serviço de push da Expo entregar no
   Android:
   ```bash
   npx eas-cli@latest credentials -p android
   ```
   (Google Service Account → "Manage your Google Service Account Key for
   Push Notifications (FCM V1)" → enviar o JSON.)

## 2. Login com Google no Android

O idToken do Android é emitido para o client ID **web** (o mesmo
`GOOGLE_CLIENT_ID` do auth-service), mas o Google exige também um client
Android cadastrado com a assinatura do app.

1. Pegar os SHA-1:
   - do keystore do EAS: `npx eas-cli@latest credentials -p android` →
     Keystore;
   - depois do primeiro upload na Play: Play Console → Integridade do app →
     Assinatura de apps (o SHA-1 da "chave de assinatura do app").
2. No Google Cloud (mesmo projeto do OAuth web): Credenciais → criar ID do
   cliente OAuth → Android, pacote `club.personaltrainr.app`, um para cada
   SHA-1.
3. Definir no EAS o client ID web para o build:
   ```bash
   npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value <GOOGLE_CLIENT_ID> --environment production --visibility plaintext
   ```

## Conta pessoal: teste fechado obrigatório

Contas pessoais criadas depois de novembro de 2023 só liberam produção
depois de um **teste fechado com pelo menos 12 testadores inscritos por 14
dias seguidos**. Começar pelo teste fechado assim que houver um `.aab`.

## 3. Play Console

1. Criar o app: nome "Personal Trainr", idioma pt-BR, app gratuito.
2. **Política de privacidade:** `https://www.personaltrainr.club/privacidade`
3. **Exclusão de conta:** `https://www.personaltrainr.club/excluir-conta`
   (também dá para excluir no app: Perfil → Excluir conta).
4. **Segurança dos dados** (o que o app coleta):
   - Informações pessoais: nome, e-mail, telefone (opcional), fotos (avatar,
     opcional).
   - Saúde e condicionamento físico: treinos, cargas, peso e altura.
   - Tudo criptografado em trânsito (HTTPS); o usuário pode pedir exclusão.
   - Não há venda nem compartilhamento para publicidade. Fotos ficam no
     Cloudinary (provedor de armazenamento); login com Google é opcional.
   - Pagamentos não são feitos no app.
5. **Classificação de conteúdo:** questionário (app de condicionamento
   físico, sem conteúdo sensível).
6. **Público-alvo:** 16 anos ou mais (igual aos Termos de Uso). Não marcar
   que o app é direcionado a crianças.
7. **Anúncios:** sim, contém anúncios (AdMob, só para alunos no plano
   gratuito). **Compras no app:** sim (assinatura Sem Anúncios, R$ 10,99/mês).
   Na Segurança dos dados, incluir **ID de publicidade** (coletado pelo SDK
   de anúncios, finalidade: publicidade) e **Histórico de compras**
   (assinatura, finalidade: funcionalidade do app).
8. **Acesso ao app para revisão:** criar uma conta de teste em produção
   (aluno vinculado a um personal, com rotina) e informar e-mail/senha no
   formulário de acesso, senão a revisão não consegue entrar.
9. Ficha da loja: ícone 512×512, imagem de destaque 1024×500, ao menos 2
   capturas de tela de celular, descrição curta e completa.

## 4. Build e envio

```bash
cd apps/mobile
npx eas-cli@latest build -p android --profile production
```

O perfil de produção gera `.aab`, aponta para `api.personaltrainr.club` e
incrementa o versionCode sozinho.

- **Primeiro envio:** manual. Baixar o `.aab` da página do build e enviar
  em Play Console → Testes → Teste interno → Criar versão.
- **Depois:** `npx eas-cli@latest submit -p android --profile production`
  (requer uma conta de serviço do Google Cloud com acesso à Play Console,
  configurada em `eas credentials`). O envio vai como rascunho na faixa
  interna (ver `eas.json`).

## 5. iOS (quando houver conta Apple Developer)

Antes de publicar na App Store falta o **Sign in with Apple**, obrigatório
para apps com login do Google (diretriz 4.8). O backend já tem o enum
`APPLE` em `OAuthAccount`.
