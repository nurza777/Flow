import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

// Resolved per call rather than at module load, so a missing secret surfaces at
// runtime instead of breaking the build. Returns null in production when
// JWT_SECRET is unset: signing a session with a committed default would let
// anyone mint a token for any role.
function sessionSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode("taskflow-development-only-secret");
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

async function signToken(user: SessionUser) {
  const secret = sessionSecret();
  if (!secret) throw new Error("JWT_SECRET is not configured");

  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

// Returns the raw token as well, so mobile clients (which can't rely on the
// httpOnly cookie) can store it and send it back as `Authorization: Bearer <token>`.
export async function createSession(user: SessionUser): Promise<string> {
  const token = await signToken(user);

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  let token = cookieStore.get("session")?.value;

  if (!token) {
    const headerStore = await headers();
    const auth = headerStore.get("authorization");
    if (auth?.startsWith("Bearer ")) token = auth.slice("Bearer ".length);
  }

  if (!token) return null;

  const secret = sessionSecret();
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
