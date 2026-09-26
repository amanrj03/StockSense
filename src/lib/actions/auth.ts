"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signUpSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import crypto from "crypto";

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const raw = {
    loginId: formData.get("loginId"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { error: firstError };
  }

  const { loginId, email, password } = parsed.data;

  // Check uniqueness server-side
  const existing = await prisma.user.findFirst({
    where: { OR: [{ loginId }, { email }] },
    select: { loginId: true, email: true },
  });

  if (existing) {
    if (existing.loginId === loginId) {
      return { error: "Login ID is already taken" };
    }
    return { error: "Email is already registered" };
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: { loginId, email, passwordHash },
  });

  redirect("/login?registered=1");
}

// ─── Credentials Sign In ──────────────────────────────────────────────────────

export async function signInAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  try {
    await signIn("credentials", {
      loginId: formData.get("loginId"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid Login Id or Password." };
    }
    throw err;
  }
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prevState: { error: string } | { success: string } | undefined,
  formData: FormData
): Promise<{ error: string } | { success: string } | undefined> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: "If that email exists, a reset link has been sent." };
  }

  // Generate OTP token (6-digit)
  const token = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.verificationToken.upsert({
    where: { identifier_token: { identifier: email, token } },
    update: { expires },
    create: { identifier: email, token, expires },
  });

  // TODO: send email via Resend in email milestone
  // For now, token is stored — dev can read it from DB
  console.info(`[DEV] OTP for ${email}: ${token}`);

  return { success: "If that email exists, a reset link has been sent." };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const raw = {
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { token, password } = parsed.data;
  const email = formData.get("email") as string;

  if (!email) return { error: "Invalid reset request" };

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  });

  if (!record || record.expires < new Date()) {
    return { error: "OTP is invalid or has expired" };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { error: "User not found" };

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    }),
  ]);

  redirect("/login?reset=1");
}