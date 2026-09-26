import { redirect } from "next/navigation";

export default function RootPage() {
  // Once auth is implemented, this will redirect based on session.
  // For now, redirect to dashboard as the app landing page.
  redirect("/dashboard");
}
