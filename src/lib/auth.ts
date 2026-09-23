import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "taskflow-secret-key-change-in-production"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

async function signToken(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
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

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
