import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { SearchParamProps } from "@/types/next";

export default async function ResetPasswordPage({ searchParams }: SearchParamProps<"/reset-password">) {
  const params = await searchParams;
  const email = typeof params?.email === "string" ? params.email : "";
  return <ResetPasswordForm email={email} />;
}
