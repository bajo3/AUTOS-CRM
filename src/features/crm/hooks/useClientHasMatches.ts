// src/features/crm/hooks/useClientHasMatches.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

/**
 * Devuelve si un cliente tiene al menos 1 match en la tabla "matches".
 * Ajustá el nombre de la tabla o la columna "client_id" si en tu schema se llaman distinto.
 */
export function useClientHasMatches(clientId: string | undefined) {
  const [hasMatches, setHasMatches] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { error, count } = await supabase
          .from('matches') // 👈 cambia el nombre si tu tabla se llama distinto
          .select('id', { count: 'exact', head: true })
          .eq('client_id', clientId);

        if (error) {
          console.error('[useClientHasMatches] error', error);
          if (!cancelled) setHasMatches(false);
          return;
        }

        if (!cancelled) {
          setHasMatches((count ?? 0) > 0);
        }
      } catch (e) {
        console.error('[useClientHasMatches] exception', e);
        if (!cancelled) setHasMatches(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  return { hasMatches, loading };
}
