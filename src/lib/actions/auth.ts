"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signUpSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { AuthError } from "next-auth";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { Resend } from "resend";

const resetSuccessMessage = "If that email exists, a reset link has been sent.";
const resetTokenLifetimeMs = 15 * 60 * 1000;
const resetResendCooldownMs = 60 * 1000;
const resetMaxAttempts = 5;

function hashResetToken(email: string, token: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to protect reset tokens");
  return createHmac("sha256", secret).update(`${email}:${token}`).digest("hex");
}

function isPrismaUniqueError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

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

  try {
    await prisma.user.create({ data: { loginId, email, passwordHash } });
  } catch (error) {
    if (isPrismaUniqueError(error)) return { error: "Login ID or email is already registered" };
    throw error;
  }

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
    return { success: resetSuccessMessage };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { success: resetSuccessMessage };

  const latestToken = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latestToken && Date.now() - latestToken.createdAt.getTime() < resetResendCooldownMs) {
    return { success: resetSuccessMessage };
  }

  const token = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const tokenHash = hashResetToken(email, token);
  const expires = new Date(Date.now() + resetTokenLifetimeMs);

  await prisma.$transaction(async (tx) => {
    await tx.verificationToken.deleteMany({ where: { identifier: email } });
    await tx.verificationToken.create({
      data: { identifier: email, token: tokenHash, expires, attempts: 0 },
    });
  });

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to: email,
      subject: "Your Lemon password reset code",
      text: `Your Lemon password reset code is ${token}. It expires in 15 minutes. If you did not request this, ignore this email.`,
    });
    if (error) throw error;
  } catch {
    await prisma.verificationToken.deleteMany({
      where: { identifier: email, token: tokenHash },
    });
    console.error("Password reset email delivery failed.");
  }

  return { success: resetSuccessMessage };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const raw = {
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, token, password } = parsed.data;
  const record = await prisma.verificationToken.findFirst({
    where: { identifier: email },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expires <= new Date()) {
    return { error: "OTP is invalid or has expired" };
  }
  if (record.attempts >= resetMaxAttempts) {
    return { error: "Too many invalid OTP attempts. Request a new code." };
  }

  const submittedHash = hashResetToken(email, token);
  const storedHash = /^[a-f0-9]{64}$/i.test(record.token)
    ? Buffer.from(record.token, "hex")
    : Buffer.alloc(0);
  const submittedHashBytes = Buffer.from(submittedHash, "hex");
  const tokenMatches = storedHash.length === submittedHashBytes.length
    && timingSafeEqual(storedHash, submittedHashBytes);

  if (!tokenMatches) {
    await prisma.verificationToken.updateMany({
      where: {
        identifier: email,
        token: record.token,
        expires: { gt: new Date() },
        attempts: { lt: resetMaxAttempts },
      },
      data: { attempts: { increment: 1 } },
    });
    return { error: "OTP is invalid or has expired" };
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return { error: "User not found" };

  const passwordHash = await hash(password, 12);

  const resetCompleted = await prisma.$transaction(async (tx) => {
    const consumed = await tx.verificationToken.deleteMany({
      where: {
        identifier: email,
        token: record.token,
        expires: { gt: new Date() },
        attempts: { lt: resetMaxAttempts },
      },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    return true;
  });
  if (!resetCompleted) return { error: "OTP is invalid or has expired" };

  redirect("/login?reset=1");
}