"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  canManageData: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Busca sessão + perfil uma única vez por sessão de navegação e compartilha via
 * contexto — sem isso, cada página que chama useAuth() refaz a checagem de sessão
 * e a consulta em `profiles` do zero ao trocar de rota.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .single();
      if (active) {
        setProfile((data as Profile) ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const canManageData = profile?.role === "admin" || profile?.role === "analista";

  return (
    <AuthContext.Provider value={{ profile, loading, signOut, canManageData }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return ctx;
}
