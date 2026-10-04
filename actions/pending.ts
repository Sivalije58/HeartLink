"use server";

import { cookies } from "next/headers";

export async function savePendingToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set("pendingToken", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.VERCEL === "1",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  return { success: true };
}