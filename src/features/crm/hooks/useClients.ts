// src/features/crm/hooks/useClients.ts
// Hook para manejar la obtención de clientes y recarga.

import { useCallback, useEffect, useState } from 'react';
import type { Client } from '../api/clients';
import { fetchClients } from '../api/clients';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (e: any) {
      console.error('Error cargando clientes', e);
      setError(e?.message || 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { clients, loading, error, reload: load };
}