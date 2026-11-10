import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDatabase, type UserRow } from "@/db";
import { signToken, verifyToken } from "./session-token";
const COOKIE = "whichcvfits_session";
export async function createSessionCookie(user: {
  id: string;
  email: string;
  name: string;
}) {
  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + 7 * 86400000,
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 86400,
  });
}
export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}
export async function getCurrentUser(): Promise<UserRow | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return (await getDatabase()).get<UserRow>(
    "SELECT * FROM users WHERE id = ?",
    [payload.userId],
  );
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
