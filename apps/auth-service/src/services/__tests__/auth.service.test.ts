import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcrypt";

vi.mock("../../repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findById: vi.fn(),
    findByIdWithHash: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updatePasswordHash: vi.fn(),
  },
}));
vi.mock("../../repositories/passwordResetToken.repository", () => ({
  passwordResetTokenRepository: {
    create: vi.fn(),
    findValidByHash: vi.fn(),
    markUsed: vi.fn(),
  },
}));
vi.mock("../../repositories/trainerProfile.repository", () => ({
  trainerProfileRepository: {
    findByUserId: vi.fn(),
    findByCref: vi.fn(),
    upsert: vi.fn(),
  },
}));
vi.mock("../../repositories/subscription.repository", () => ({
  subscriptionRepository: {
    findByUserId: vi.fn(),
    createDefault: vi.fn(),
    updateByUserId: vi.fn(),
  },
}));
vi.mock("../../providers/EmailProvider", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

import { authService } from "../auth.service";
import { userRepository } from "../../repositories/user.repository";
import { passwordResetTokenRepository } from "../../repositories/passwordResetToken.repository";
import { trainerProfileRepository } from "../../repositories/trainerProfile.repository";
import { subscriptionRepository } from "../../repositories/subscription.repository";
import { sendPasswordResetEmail } from "../../providers/EmailProvider";

const baseUser = {
  id: "user-1",
  name: "Aluno Teste",
  email: "aluno@example.com",
  username: "alunoteste",
  passwordHash: "hashed",
  role: "ALUNO" as const,
  avatarUrl: null,
  phone: null,
  instagram: null,
  bio: null,
  weight: null,
  height: null,
  birthDate: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService.register", () => {
  it("rejeita email já em uso", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(baseUser);

    await expect(
      authService.register({
        name: "X",
        email: "aluno@example.com",
        password: "senha123",
        role: "ALUNO",
        username: "x",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Email already in use" });
  });

  it("rejeita username já em uso", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(baseUser);

    await expect(
      authService.register({
        name: "X",
        email: "novo@example.com",
        password: "senha123",
        role: "ALUNO",
        username: "alunoteste",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Nome de usuário já existe" });
  });

  it("rejeita cadastro de TRAINER sem CREF/UF/cidade", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null);

    await expect(
      authService.register({
        name: "Personal",
        email: "personal@example.com",
        password: "senha123",
        role: "TRAINER",
        username: "personal",
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Registro CREF, UF e cidade são obrigatórios para personal trainers",
    });
  });

  it("rejeita CREF já cadastrado por outro trainer", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(trainerProfileRepository.findByCref).mockResolvedValue({
      id: "tp-1",
      userId: "other-user",
      cref: "123456-G",
      crefState: "SP" as any,
      crefCity: "São Paulo",
      experienceYears: null,
      specialties: null,
      website: null,
    });

    await expect(
      authService.register({
        name: "Personal",
        email: "personal@example.com",
        password: "senha123",
        role: "TRAINER",
        username: "personal",
        cref: "123456-G",
        crefState: "SP",
        crefCity: "São Paulo",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Este registro CREF já está cadastrado" });
  });

  it("cadastra ALUNO com sucesso sem criar TrainerProfile/Subscription", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({ ...baseUser } as any);

    const result = await authService.register({
      name: "Aluno Teste",
      email: "aluno@example.com",
      password: "senha123",
      role: "ALUNO",
      username: "alunoteste",
    });

    expect(result.user.id).toBe("user-1");
    expect(trainerProfileRepository.upsert).not.toHaveBeenCalled();
    expect(subscriptionRepository.createDefault).not.toHaveBeenCalled();
  });

  it("cadastra TRAINER com sucesso criando TrainerProfile e Subscription (plano Grátis)", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(trainerProfileRepository.findByCref).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({
      ...baseUser,
      id: "trainer-1",
      role: "TRAINER",
    } as any);

    await authService.register({
      name: "Personal",
      email: "personal@example.com",
      password: "senha123",
      role: "TRAINER",
      username: "personal",
      cref: "123456-G",
      crefState: "SP",
      crefCity: "São Paulo",
    });

    expect(trainerProfileRepository.upsert).toHaveBeenCalledWith(
      "trainer-1",
      expect.objectContaining({ cref: "123456-G", crefState: "SP", crefCity: "São Paulo" }),
    );
    expect(subscriptionRepository.createDefault).toHaveBeenCalledWith("trainer-1");
  });
});

describe("authService.login", () => {
  it("rejeita email inexistente", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(authService.login("nope@example.com", "senha123")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
  });

  it("rejeita senha incorreta", async () => {
    const hash = await bcrypt.hash("senhacerta", 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...baseUser, passwordHash: hash });

    await expect(authService.login(baseUser.email, "senhaerrada")).rejects.toMatchObject({
      status: 401,
      message: "Invalid email or password",
    });
  });

  it("retorna token e dados do usuário com senha correta", async () => {
    const hash = await bcrypt.hash("senhacerta", 10);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...baseUser, passwordHash: hash });

    const result = await authService.login(baseUser.email, "senhacerta");

    expect(result.token).toBeTruthy();
    expect(result.user.email).toBe(baseUser.email);
    expect((result.user as any).passwordHash).toBeUndefined();
  });
});

describe("authService.requestPasswordReset", () => {
  it("não vaza se o email existe: sempre retorna a mesma mensagem genérica", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    const result = await authService.requestPasswordReset("naoexiste@example.com");

    expect(result.message).toBe("Se o email existir em nossa base, enviaremos um link de redefinição.");
    expect(passwordResetTokenRepository.create).not.toHaveBeenCalled();
  });

  it("cria token e envia email quando o usuário existe", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(baseUser);

    const result = await authService.requestPasswordReset(baseUser.email);

    expect(passwordResetTokenRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: baseUser.id }),
    );
    expect(sendPasswordResetEmail).toHaveBeenCalled();
    expect(result.message).toBe("Se o email existir em nossa base, enviaremos um link de redefinição.");
  });

  it("retorna sucesso mesmo se o envio de email falhar (não derruba a request)", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(baseUser);
    vi.mocked(sendPasswordResetEmail).mockRejectedValue(new Error("SMTP down"));

    const result = await authService.requestPasswordReset(baseUser.email);

    expect(result.message).toBe("Se o email existir em nossa base, enviaremos um link de redefinição.");
  });
});

describe("authService.resetPassword", () => {
  it("rejeita token inválido ou expirado", async () => {
    vi.mocked(passwordResetTokenRepository.findValidByHash).mockResolvedValue(null);

    await expect(authService.resetPassword("token-invalido", "novaSenha123")).rejects.toMatchObject({
      status: 400,
      message: "Token inválido ou expirado",
    });
  });

  it("redefine a senha e marca o token como usado", async () => {
    vi.mocked(passwordResetTokenRepository.findValidByHash).mockResolvedValue({
      id: "reset-1",
      userId: baseUser.id,
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 10000),
      usedAt: null,
      createdAt: new Date(),
    });

    const result = await authService.resetPassword("token-valido", "novaSenha123");

    expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(baseUser.id, expect.any(String));
    expect(passwordResetTokenRepository.markUsed).toHaveBeenCalledWith("reset-1");
    expect(result.message).toBe("Senha redefinida com sucesso");
  });
});

describe("authService.getSubscription", () => {
  it("rejeita usuário que não é TRAINER", async () => {
    await expect(authService.getSubscription("user-1", "ALUNO")).rejects.toMatchObject({
      status: 403,
      message: "Apenas treinadores possuem assinatura",
    });
  });

  it("cria assinatura padrão (Grátis) se o trainer ainda não tem uma", async () => {
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue(null);
    vi.mocked(subscriptionRepository.createDefault).mockResolvedValue({
      id: "sub-1",
      userId: "trainer-1",
      plan: "FREE",
      status: "ACTIVE",
      asaasCustomerId: null,
      asaasSubscriptionId: null,
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.getSubscription("trainer-1", "TRAINER");

    expect(result.subscription.plan).toBe("FREE");
    expect(result.subscription.studentLimit).toBe(3);
  });

  it("retorna studentLimit null para plano Ilimitado", async () => {
    vi.mocked(subscriptionRepository.findByUserId).mockResolvedValue({
      id: "sub-1",
      userId: "trainer-1",
      plan: "UNLIMITED",
      status: "ACTIVE",
      asaasCustomerId: "cus_1",
      asaasSubscriptionId: "sub_1",
      currentPeriodEnd: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.getSubscription("trainer-1", "TRAINER");

    expect(result.subscription.studentLimit).toBeNull();
  });
});

describe("authService.updateTrainerProfile", () => {
  it("rejeita usuário que não é TRAINER", async () => {
    await expect(
      authService.updateTrainerProfile("user-1", "ALUNO", {
        cref: "1",
        crefState: "SP" as any,
        crefCity: "SP",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejeita CREF já usado por outro trainer", async () => {
    vi.mocked(trainerProfileRepository.findByCref).mockResolvedValue({
      id: "tp-1",
      userId: "outro-trainer",
      cref: "123456-G",
      crefState: "SP" as any,
      crefCity: "São Paulo",
      experienceYears: null,
      specialties: null,
      website: null,
    });

    await expect(
      authService.updateTrainerProfile("trainer-1", "TRAINER", {
        cref: "123456-G",
        crefState: "SP" as any,
        crefCity: "São Paulo",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Este registro CREF já está cadastrado" });
  });

  it("permite manter o próprio CREF ao atualizar outros campos", async () => {
    vi.mocked(trainerProfileRepository.findByCref).mockResolvedValue({
      id: "tp-1",
      userId: "trainer-1",
      cref: "123456-G",
      crefState: "SP" as any,
      crefCity: "São Paulo",
      experienceYears: null,
      specialties: null,
      website: null,
    });
    vi.mocked(trainerProfileRepository.upsert).mockResolvedValue({
      id: "tp-1",
      userId: "trainer-1",
      cref: "123456-G",
      crefState: "SP" as any,
      crefCity: "São Paulo",
      experienceYears: 5,
      specialties: "Hipertrofia",
      website: null,
    });

    const result = await authService.updateTrainerProfile("trainer-1", "TRAINER", {
      cref: "123456-G",
      crefState: "SP" as any,
      crefCity: "São Paulo",
      experienceYears: 5,
      specialties: "Hipertrofia",
    });

    expect(result.trainerProfile.experienceYears).toBe(5);
  });
});
