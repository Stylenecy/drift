import { redirect } from "next/navigation";
import { auth, AUTH_ENABLED } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // Without Google OAuth (the hosted demo) there is nothing to sign in to.
  if (!AUTH_ENABLED) redirect("/dashboard");
  const session = await auth();
  if (session) redirect("/dashboard");
  return <LoginForm />;
}
