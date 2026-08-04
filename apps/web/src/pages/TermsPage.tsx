import { Link } from 'react-router-dom';

export function TermsPage() {
  return (
    <main className="min-h-screen bg-base px-5 py-12 font-body text-text-primary">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-xs uppercase text-accent transition hover:opacity-80">
          &larr; Voltar para Home
        </Link>

        <h1 className="mt-6 font-title text-3xl uppercase tracking-wider text-text-primary">
          Termos de Uso
        </h1>
        <p className="mt-2 text-xs text-text-secondary">Última atualização: 03 de agosto de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-secondary">
          <p>
            Estes Termos de Uso regulam o acesso e uso da plataforma <strong className="text-text-primary">Personal
            Trainr</strong>. Ao criar uma conta, você concorda com os termos abaixo.
          </p>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">1. O que é a plataforma</h2>
            <p>
              A Personal Trainr conecta personal trainers e alunos, permitindo a criação e o acompanhamento de
              rotinas de treino. A plataforma não substitui orientação médica ou avaliação física profissional
              presencial.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">2. Cadastro e conta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você deve fornecer informações verdadeiras, completas e atualizadas no cadastro.</li>
              <li>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades na sua conta.</li>
              <li>Personal trainers declaram possuir registro profissional (CREF) válido, informado no cadastro.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">3. Planos e pagamento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personal trainers podem assinar planos pagos para aumentar o limite de alunos vinculados.</li>
              <li>Pagamentos são processados por um parceiro externo (Asaas); não armazenamos dados de cartão.</li>
              <li>Assinaturas são renovadas automaticamente até serem canceladas.</li>
              <li>Em caso de inadimplência, a conta retorna automaticamente ao plano gratuito e seus limites.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">4. Conduta do usuário</h2>
            <p>Ao usar a plataforma, você concorda em não:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Enviar conteúdo ofensivo, ilegal ou que viole direitos de terceiros;</li>
              <li>Tentar acessar contas ou dados de outros usuários sem autorização;</li>
              <li>Utilizar a plataforma para fins fraudulentos ou que violem a lei.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">5. Responsabilidade profissional</h2>
            <p>
              O conteúdo de rotinas e orientações de treino é de responsabilidade exclusiva do personal trainer
              que o elabora. A Personal Trainr atua apenas como plataforma de tecnologia e não se responsabiliza
              por lesões, resultados ou orientações profissionais fornecidas pelos personal trainers.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">6. Cancelamento</h2>
            <p>
              Você pode cancelar sua conta e/ou assinatura a qualquer momento. O cancelamento de uma assinatura
              paga não gera reembolso proporcional ao período já pago, salvo disposição legal em contrário.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">7. Alterações destes termos</h2>
            <p>
              Podemos atualizar estes Termos periodicamente. O uso continuado da plataforma após alterações
              constitui aceite dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="font-title text-lg uppercase text-text-primary mb-2">8. Contato</h2>
            <p>
              Dúvidas sobre estes Termos podem ser enviadas para{' '}
              <span className="text-text-primary">[email de contato a definir]</span>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
