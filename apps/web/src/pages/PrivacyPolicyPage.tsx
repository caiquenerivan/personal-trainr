import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-base px-5 py-12 font-body text-text-primary">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase text-accent transition hover:opacity-80">
          &larr; Voltar para Home
        </Link>

        <h1 className="mt-6 font-title text-3xl uppercase tracking-wider text-text-primary">
          Política de Privacidade
        </h1>
        <p className="mt-2 text-xs text-text-secondary">Última atualização: 03 de agosto de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-secondary">
          <p>
            Esta Política de Privacidade descreve como a <strong className="text-text-primary">Personal Trainr</strong> ("nós")
            coleta, usa, armazena e protege os dados pessoais dos usuários da plataforma ("você"), em conformidade
            com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
          </p>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">1. Dados que coletamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados de cadastro: nome, e-mail, nome de usuário, telefone e senha (armazenada de forma criptografada).</li>
              <li>Dados de perfil: foto, biografia, Instagram, peso, altura e data de nascimento (opcionais).</li>
              <li>Dados profissionais (personal trainers): registro CREF, UF, cidade, especialidades e experiência.</li>
              <li>Dados de treino: rotinas, exercícios, cargas e histórico de treinos concluídos.</li>
              <li>Dados de pagamento (personal trainers assinantes): CPF/CNPJ, processado diretamente pelo nosso
                parceiro de pagamentos (Asaas) — não armazenamos dados de cartão de crédito.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">2. Para que usamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Viabilizar o funcionamento da plataforma (login, rotinas, acompanhamento de treinos).</li>
              <li>Conectar personal trainers e alunos.</li>
              <li>Processar assinaturas e pagamentos de planos.</li>
              <li>Enviar e-mails operacionais (confirmação de cadastro, redefinição de senha).</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">3. Com quem compartilhamos dados</h2>
            <p>Compartilhamos dados apenas com prestadores de serviço estritamente necessários para operar a plataforma:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-text-primary">Asaas</strong> — processamento de pagamentos e cobrança de assinaturas.</li>
              <li><strong className="text-text-primary">Cloudinary</strong> — armazenamento de fotos de perfil.</li>
              <li><strong className="text-text-primary">Brevo</strong> — envio de e-mails transacionais (ex: redefinição de senha).</li>
            </ul>
            <p className="mt-2">Não vendemos nem alugamos seus dados pessoais a terceiros.</p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">4. Seus direitos (LGPD)</h2>
            <p>Você pode, a qualquer momento, solicitar:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Confirmação da existência de tratamento e acesso aos seus dados.</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados.</li>
              <li>Exclusão dos dados pessoais tratados com o seu consentimento.</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço.</li>
              <li>Revogação do consentimento e informações sobre compartilhamento de dados.</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, entre em contato pelo e-mail{' '}
              <span className="text-text-primary">[email de contato a definir]</span>.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">5. Retenção de dados</h2>
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa ou enquanto necessário para cumprir finalidades
              legais, contratuais ou regulatórias. Você pode solicitar a exclusão da sua conta e dos dados
              associados a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">6. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo criptografia de
              senhas e conexões seguras (HTTPS). Nenhum sistema é 100% livre de riscos, e trabalhamos continuamente
              para reduzir vulnerabilidades.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">7. Alterações desta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Alterações relevantes serão comunicadas por e-mail
              ou aviso na plataforma.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
