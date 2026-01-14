import jwt from "jsonwebtoken";
import { z } from "zod";

const payloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
});

const JWT_ISSUER = "rezoomind";
const JWT_AUDIENCE = "rezoomind-users";
const COOKIE_NAME = "rezoomind_token";

export type SessionUser = {
  id: string;
  email: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

export function getSessionCookieName() {
  return COOKIE_NAME;
}

export function createSessionToken(user: SessionUser) {
  const secret = getJwtSecret();

  return jwt.sign(
    { email: user.email },
    secret,
    {
      subject: user.id,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      expiresIn: "7d",
    }
  );
}

export function verifySessionToken(token: string) {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (typeof decoded === "string") {
      return null;
    }

    const parsed = payloadSchema.safeParse({
      sub: decoded.sub,
      email: decoded.email,
    });

    if (!parsed.success) {
      return null;
    }

    return {
      id: parsed.data.sub,
      email: parsed.data.email,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}
