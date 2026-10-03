"use client";

import { createContext, useContext, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

// Whether Google sign-in is configured on the server (AUTH_ENABLED in lib/auth).
const AuthEnabled = createContext(false);

export const useAuthEnabled = () => useContext(AuthEnabled);

export function AuthProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  return (
    <AuthEnabled.Provider value={enabled}>
      <SessionProvider>{children}</SessionProvider>
    </AuthEnabled.Provider>
  );
}
