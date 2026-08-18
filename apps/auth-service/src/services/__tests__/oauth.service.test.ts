import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../repositories/user.repository", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    findByIdWithHash: vi.fn(),
    create: vi.fn(),
    updateEmailVerified: vi.fn(),
  },
}));
vi.mock("../../repositories/oauthAccount.repository", () => ({
  oauthAccountRepository: {
    findByProviderAndProviderUserId: vi.fn(),
    create: vi.fn(),
  },
}));

import { loginOrLinkOAuthUser, generateOAuthState, verifyOAuthState } from "../oauth.service";
import { userRepository } from "../../repositories/user.repository";
import { oauthAccountRepository } from "../../repositories/oauthAccount.repository";

const baseUser = {
  id: "user-1",
  name: "Aluno Teste",
  email: "aluno@example.com",
  username: "alunoteste",
  passwordHash: "hashed",
  role: "ALUNO" as const,
  isActive: true,
  emailVerified: true,
  avatarUrl: null,
  phone: null,
  instagram: null,
  bio: null,
  weight: null,
  height: null,
  birthDate: null,
  createdAt: new Date(),
  twoFactorSecret: null,
  twoFactorEnabled: false,
  twoFactorBackupCodes: [] as string[],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("oauth.service state (CSRF)", () => {
  it("gera um state válido que passa na verificação", () => {
    const state = generateOAuthState();
    expect(verifyOAuthState(state)).toBe(true);
  });

  it("rejeita state forjado/malformado", () => {
    expect(verifyOAuthState("token-forjado")).toBe(false);
  });
});

describe("loginOrLinkOAuthUser", () => {
  it("cria um novo usuário (ALUNO, sem senha, email já verificado) quando não existe conta nem vínculo", async () => {
    vi.mocked(oauthAccountRepository.findByProviderAndProviderUserId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(userRepository.findByUsername).mockResolvedValue(null);
    vi.mocked(userRepository.create).mockResolvedValue({ ...baseUser, id: "new-user" } as any);
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue({ ...baseUser, id: "new-user" });

    const result = await loginOrLinkOAuthUser({
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: "novo@example.com",
      name: "Novo Usuário",
    });

    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: null, role: "ALUNO", emailVerified: true }),
    );
    expect(oauthAccountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "new-user", provider: "GOOGLE", providerUserId: "google-sub-123" }),
    );
    expect((result as any).token).toBeTruthy();
  });

  it("linka automaticamente a uma conta de senha existente com o mesmo email", async () => {
    vi.mocked(oauthAccountRepository.findByProviderAndProviderUserId).mockResolvedValue(null);
    vi.mocked(userRepository.findByEmail).mockResolvedValue({ ...baseUser, emailVerified: false });
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue({ ...baseUser, emailVerified: true });

    const result = await loginOrLinkOAuthUser({
      provider: "GOOGLE",
      providerUserId: "google-sub-456",
      email: baseUser.email,
      name: baseUser.name,
    });

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(oauthAccountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: baseUser.id, provider: "GOOGLE" }),
    );
    // conta linkada via provedor já validado deve ficar marcada como verificada
    expect(userRepository.updateEmailVerified).toHaveBeenCalledWith(baseUser.id, true);
    expect((result as any).token).toBeTruthy();
  });

  it("reusa a conta já vinculada (login recorrente), sem criar nada novo", async () => {
    vi.mocked(oauthAccountRepository.findByProviderAndProviderUserId).mockResolvedValue({
      id: "oauth-1",
      userId: baseUser.id,
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: baseUser.email,
      createdAt: new Date(),
    });
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue(baseUser);

    const result = await loginOrLinkOAuthUser({
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: baseUser.email,
      name: baseUser.name,
    });

    expect(userRepository.create).not.toHaveBeenCalled();
    expect(oauthAccountRepository.create).not.toHaveBeenCalled();
    expect((result as any).token).toBeTruthy();
  });

  it("respeita 2FA ativo: retorna tempToken em vez do JWT final", async () => {
    vi.mocked(oauthAccountRepository.findByProviderAndProviderUserId).mockResolvedValue({
      id: "oauth-1",
      userId: baseUser.id,
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: baseUser.email,
      createdAt: new Date(),
    });
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue({ ...baseUser, twoFactorEnabled: true });

    const result = await loginOrLinkOAuthUser({
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: baseUser.email,
      name: baseUser.name,
    });

    expect(result).toMatchObject({ requiresTwoFactor: true });
    expect((result as any).tempToken).toBeTruthy();
  });

  it("rejeita conta desativada mesmo já tendo vínculo OAuth", async () => {
    vi.mocked(oauthAccountRepository.findByProviderAndProviderUserId).mockResolvedValue({
      id: "oauth-1",
      userId: baseUser.id,
      provider: "GOOGLE",
      providerUserId: "google-sub-123",
      email: baseUser.email,
      createdAt: new Date(),
    });
    vi.mocked(userRepository.findByIdWithHash).mockResolvedValue({ ...baseUser, isActive: false });

    await expect(
      loginOrLinkOAuthUser({
        provider: "GOOGLE",
        providerUserId: "google-sub-123",
        email: baseUser.email,
        name: baseUser.name,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });
});
