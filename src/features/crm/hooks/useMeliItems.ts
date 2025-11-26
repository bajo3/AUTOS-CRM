/// Updated version of src/features/crm/hooks/useMeliItems.ts
//
// This hook wraps Mercado Libre item operations for the React Native UI.
// The original implementation incorrectly assumed that getUserActiveItems
// returned an array of items and passed the user ID directly. This
// update adjusts the usage to the correct API contract and adds robust
// error handling.

import { useCallback, useEffect, useState } from 'react';
import {
  getUserActiveItems,
  MeliItem,
  updateItemPrice,
  closeItem,
  UserActiveItemsResult,
} from '../../../../src/lib/meliApi';

export type RelistStep = 'idle' | 'closing' | 'creating';

const DEFAULT_USER_ID = '327544193';

type UseMeliItemsOptions = {
  userId?: string;
};

type UseMeliItemsResult = {
  items: MeliItem[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  relistStep: RelistStep;
  relistLoading: boolean;
  relistError: string | null;
  reload: () => void;
  changePrice: (id: string, newPrice: number) => Promise<void>;
  closePublication: (id: string) => Promise<void>;
};

export function useMeliItems(
  options: UseMeliItemsOptions = {}
): UseMeliItemsResult {
  const userId = options.userId || DEFAULT_USER_ID;

  const [items, setItems] = useState<MeliItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relistStep, setRelistStep] = useState<RelistStep>('idle');
  const [relistLoading, setRelistLoading] = useState(false);
  const [relistError, setRelistError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // getUserActiveItems devuelve un objeto con items y paginación; extraemos items
      const result: UserActiveItemsResult = await getUserActiveItems({ sellerId: userId });
      setItems(result.items);
    } catch (e: any) {
      console.error('Error cargando items de ML', e);
      setError(e?.message || 'Error cargando publicaciones');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const result: UserActiveItemsResult = await getUserActiveItems({ sellerId: userId });
      setItems(result.items);
    } catch (e: any) {
      console.error('Error recargando items de ML', e);
      setError(e?.message || 'Error recargando publicaciones');
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const changePrice = useCallback(
    async (id: string, newPrice: number) => {
      try {
        await updateItemPrice(id, newPrice);
        await reload();
      } catch (e: any) {
        console.error('Error cambiando precio', e);
        setError(e?.message || 'Error cambiando precio');
      }
    },
    [reload]
  );

  const closePublication = useCallback(
    async (id: string) => {
      setRelistLoading(true);
      setRelistStep('closing');
      setRelistError(null);
      try {
        await closeItem(id);
        setRelistStep('idle');
        await reload();
      } catch (e: any) {
        console.error('Error cerrando publicación', e);
        setRelistError(e?.message || 'Error cerrando publicación');
        setRelistStep('idle');
      } finally {
        setRelistLoading(false);
      }
    },
    [reload]
  );

  return {
    items,
    loading,
    error,
    refreshing,
    relistStep,
    relistLoading,
    relistError,
    reload,
    changePrice,
    closePublication,
  };
}