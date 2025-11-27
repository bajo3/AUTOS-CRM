// src/features/crm/hooks/useMeliItems.ts
import { useCallback, useEffect, useState } from 'react';
import {
  getUserActiveItems,
  type MeliItem,
  type UserActiveItemsResult,
  updateItemPrice,
  closeItem,
  relistItem,
} from '../../../lib/meliApi';

export type RelistStep = 'idle' | 'closing' | 'creating';

const DEFAULT_USER_ID = '327544193';

type UseMeliItemsOptions = {
  userId?: string;
};

export type SortMode = 'recent' | 'oldest';

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
  relistPublication: (id: string) => Promise<void>;

  // paginación
  canLoadMore: boolean;
  loadingMore: boolean;
  loadMore: () => Promise<void>;

  // orden
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
};

function sortItems(items: MeliItem[], mode: SortMode): MeliItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aDateStr = (a.start_time || (a as any).date_created) ?? '';
    const bDateStr = (b.start_time || (b as any).date_created) ?? '';
    const aTs = aDateStr ? new Date(aDateStr).getTime() : 0;
    const bTs = bDateStr ? new Date(bDateStr).getTime() : 0;

    if (mode === 'recent') {
      return bTs - aTs; // más recientes primero
    }
    return aTs - bTs; // más viejas primero
  });
  return sorted;
}

export function useMeliItems(
  options: UseMeliItemsOptions = {}
): UseMeliItemsResult {
  const userId = options.userId || DEFAULT_USER_ID;

  const [items, setItems] = useState<MeliItem[]>([]);
  const [paging, setPaging] =
    useState<UserActiveItemsResult['paging'] | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [relistStep, setRelistStep] = useState<RelistStep>('idle');
  const [relistLoading, setRelistLoading] = useState(false);
  const [relistError, setRelistError] = useState<string | null>(null);

  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const computeCanLoadMore = useCallback(() => {
    if (!paging) return false;
    const { total, offset, limit } = paging;
    return offset + limit < total;
  }, [paging]);

  const baseParams = {
    sellerId: userId,
    limit: 50,
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserActiveItems({
        ...baseParams,
        offset: 0,
      });
      setPaging(data.paging);
      setItems(sortItems(data.items, sortMode));
    } catch (e: any) {
      console.error('Error cargando items de ML', e);
      setError(e?.message || 'Error cargando publicaciones');
    } finally {
      setLoading(false);
    }
  }, [userId, sortMode]); // baseParams depende de userId pero es constante aquí

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await getUserActiveItems({
        ...baseParams,
        offset: 0,
      });
      setPaging(data.paging);
      setItems(sortItems(data.items, sortMode));
    } catch (e: any) {
      console.error('Error recargando items de ML', e);
      setError(e?.message || 'Error recargando publicaciones');
    } finally {
      setRefreshing(false);
    }
  }, [userId, sortMode]);

  const loadMore = useCallback(async () => {
    if (!computeCanLoadMore() || loadingMore) return;
    setLoadingMore(true);
    setError(null);

    try {
      const currentCount = items.length;
      const data = await getUserActiveItems({
        ...baseParams,
        offset: currentCount,
      });

      setPaging(data.paging);
      // concatenar y eliminar duplicados
      const merged: MeliItem[] = [];
      const seen = new Set<string>();

      for (const it of [...items, ...data.items]) {
        if (!seen.has(it.id)) {
          seen.add(it.id);
          merged.push(it);
        }
      }

      setItems(sortItems(merged, sortMode));
    } catch (e: any) {
      console.error('Error cargando más items de ML', e);
      setError(e?.message || 'Error cargando más publicaciones');
    } finally {
      setLoadingMore(false);
    }
  }, [items, userId, sortMode, computeCanLoadMore, loadingMore]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Reordenar cuando cambia sortMode
  useEffect(() => {
    setItems((prev) => sortItems(prev, sortMode));
  }, [sortMode]);

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

  const relistPublication = useCallback(
    async (id: string) => {
      setRelistLoading(true);
      setRelistStep('creating');
      setRelistError(null);
      try {
        await relistItem(id);
        setRelistStep('idle');
        await reload();
      } catch (e: any) {
        console.error('Error relistando publicación', e);
        setRelistError(e?.message || 'Error relistando publicación');
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
    relistPublication,
    canLoadMore: computeCanLoadMore(),
    loadingMore,
    loadMore,
    sortMode,
    setSortMode,
  };
}
