import LoginForm from "@/components/auth/LoginForm";
import type { SearchParamProps } from "@/types/next";

export default async function LoginPage({ searchParams }: SearchParamProps<"/login">) {
  const params = await searchParams;
  const registered = params?.registered === "1";
  const reset = params?.reset === "1";

  return (
    <LoginForm
      successMessage={
        registered
          ? "Account created. Please sign in."
          : reset
          ? "Password reset. Please sign in."
          : undefined
      }
    />
  );
}
