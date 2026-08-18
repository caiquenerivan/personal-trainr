import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Redefinição de senha — Personal Trainr",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha na Personal Trainr.</p>
        <p>Clique no link abaixo para criar uma nova senha. Este link expira em 1 hora.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#af9150;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Redefinir senha</a></p>
        <p>Se você não solicitou isso, pode ignorar este email com segurança.</p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Confirme seu e-mail — Personal Trainr",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Confirme seu e-mail</h2>
        <p>Falta pouco para começar a usar a Personal Trainr.</p>
        <p>Clique no link abaixo para confirmar seu e-mail. Este link expira em 24 horas.</p>
        <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#af9150;color:#000;text-decoration:none;border-radius:8px;font-weight:bold;">Confirmar e-mail</a></p>
        <p>Se você não criou uma conta, pode ignorar este email com segurança.</p>
      </div>
    `,
  });
}
