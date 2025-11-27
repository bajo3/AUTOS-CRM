// src/features/crm/api/searches.ts
// API para operar con la tabla `search_requests` de Supabase.

import { supabase } from '../../../lib/supabaseClient';
import type { ClientSearchRequest } from './clients';

/**
 * Obtiene todas las solicitudes de búsqueda sin filtrar por cliente.
 */
export async function fetchSearchRequests(): Promise<ClientSearchRequest[]> {
  const { data, error } = await supabase
    .from('search_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error cargando search_requests', error);
    throw new Error(error.message || 'Error cargando búsquedas');
  }
  return (data || []) as ClientSearchRequest[];
}