"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchProdutoStats } from "@/lib/supabase/queries";

interface ProdutoStats {
  total: number;
  byEquipamento: { equipamento: string; total: number }[];
  byFabricante: { fabricante: string; total: number }[];
}

export function useProdutoStats() {
  const [stats, setStats] = useState<ProdutoStats | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await fetchProdutoStats(supabase);
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      reload();
    }, 0);
    return () => clearTimeout(timer);
  }, [reload]);

  return { stats, loading, reload };
}
