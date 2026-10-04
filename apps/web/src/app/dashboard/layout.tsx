import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, AUTH_ENABLED } from "@/lib/auth";
import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { Topbar } from "@/features/dashboard/components/Topbar";
import { EngineGate } from "@/features/dashboard/components/EngineGate";
import { AuthProvider } from "@/components/AuthProvider";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Gate the cockpit behind Google sign-in — but only once OAuth is configured,
  // so the app stays usable locally before AUTH_GOOGLE_ID is set.
  if (AUTH_ENABLED) {
    const session = await auth();
    if (!session) redirect("/login");
  }

  // The session provider lives here, not in the root layout: only the cockpit
  // reads the session, so public pages load no auth code and make no session call.
  return (
    <AuthProvider enabled={AUTH_ENABLED}>
      <div className="flex h-screen overflow-hidden bg-ink text-bone">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
            <div className="mx-auto max-w-[1180px]">
              <EngineGate>{children}</EngineGate>
            </div>
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
