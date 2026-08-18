import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { generateOAuthState, verifyOAuthState, loginOrLinkOAuthUser } from "../services/oauth.service";
import { logger } from "../lib/logger";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are required");
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// URL pública do api-gateway (não do auth-service) — é o que o navegador do
// usuário efetivamente alcança, e é o único caminho que passa pelo
// requireInternalSecret do auth-service no retorno do Google.
const PUBLIC_GATEWAY_URL = process.env.PUBLIC_GATEWAY_URL || "http://localhost:8000";
const GOOGLE_REDIRECT_URI = `${PUBLIC_GATEWAY_URL}/api/auth/google/callback`;

function getClient(): OAuth2Client {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

export async function googleRedirect(_req: Request, res: Response): Promise<any> {
  const client = getClient();
  const state = generateOAuthState();
  const authUrl = client.generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state,
  });
  return res.redirect(authUrl);
}

export async function googleCallback(req: Request, res: Response): Promise<any> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const failureRedirect = `${frontendUrl}/login?oauth_error=1`;

  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || !state || !verifyOAuthState(state)) {
      return res.redirect(failureRedirect);
    }

    const client = getClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      return res.redirect(failureRedirect);
    }

    const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      return res.redirect(failureRedirect);
    }

    const session = await loginOrLinkOAuthUser({
      provider: "GOOGLE",
      providerUserId: payload.sub,
      email: payload.email,
      name: payload.name || "",
    });

    if ("requiresTwoFactor" in session) {
      return res.redirect(`${frontendUrl}/oauth/callback?tempToken=${session.tempToken}&twoFactor=1`);
    }

    return res.redirect(`${frontendUrl}/oauth/callback?token=${session.token}`);
  } catch (error) {
    logger.error({ err: error }, "Google OAuth callback error");
    return res.redirect(failureRedirect);
  }
}
