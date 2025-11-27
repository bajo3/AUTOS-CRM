// src/features/crm/hooks/useVehicles.ts
import { useCallback, useEffect, useState } from 'react';
import { fetchVehicles } from '../api/vehicles';
import type { Vehicle } from '../types';

type UseVehiclesResult = {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (e: any) {
      console.error('Error cargando vehicles', e);
      setError(e?.message || 'Error cargando vehículos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    vehicles,
    loading,
    error,
    reload: load,
  };
}
