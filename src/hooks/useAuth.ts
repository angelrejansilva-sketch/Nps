"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
}

export function useAuth() {
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

  return { profile, loading, signOut, canManageData };
}
