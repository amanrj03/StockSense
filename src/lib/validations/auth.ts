import { z } from "zod";

export const signInSchema = z.object({
  loginId: z
    .string()
    .min(6, "Login ID must be at least 6 characters")
    .max(12, "Login ID must be at most 12 characters"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z
  .object({
    loginId: z
      .string()
      .min(6, "Login ID must be between 6–12 characters")
      .max(12, "Login ID must be between 6–12 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Login ID can only contain letters, numbers, and underscores"
      ),
    email: z.string().trim().email("Enter a valid email address").transform((email) => email.toLowerCase()),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").transform((email) => email.toLowerCase()),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address").transform((email) => email.toLowerCase()),
    token: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
