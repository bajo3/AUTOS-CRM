// src/features/crm/hooks/useSearchRequests.ts
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import type {
  Client,
  ClientSearchRequest,
} from '../api/clients';

export type SearchWithClient = ClientSearchRequest & {
  client?: Client | null;
};

type UseSearchRequestsResult = {
  searches: SearchWithClient[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useSearchRequests(): UseSearchRequestsResult {
  const [searches, setSearches] = useState<SearchWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('search_requests')
        .select(
          `
          *,
          client:clients(*)
        `
        )
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('[useSearchRequests] error', dbError);
        setError(dbError.message || 'Error cargando búsquedas');
        setSearches([]);
        return;
      }

      setSearches((data || []) as SearchWithClient[]);
    } catch (e: any) {
      console.error('[useSearchRequests] exception', e);
      setError(e?.message || 'Error cargando búsquedas');
      setSearches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { searches, loading, error, reload: load };
}
