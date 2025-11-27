// src/features/crm/hooks/useSearchRequests.ts
// Hook para obtener y recargar todas las solicitudes de búsqueda.

import { useCallback, useEffect, useState } from 'react';
import type { ClientSearchRequest } from '../api/clients';
import { fetchSearchRequests } from '../api/searches';

export function useSearchRequests() {
  const [searches, setSearches] = useState<ClientSearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSearchRequests();
      setSearches(data);
    } catch (e: any) {
      console.error('Error cargando búsquedas', e);
      setError(e?.message || 'Error cargando búsquedas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { searches, loading, error, reload: load };
}