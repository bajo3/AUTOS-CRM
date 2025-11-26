// src/features/crm/api/clients.ts
import { supabase } from '../../../lib/supabaseClient';

export type Client = {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

export type ClientSearchRequest = {
  id: string;
  client_id: string;
  title?: string | null; // ej: "SUV hasta 8M"
  description?: string | null;
  brand?: string | null;
  year_min?: number | null;
  year_max?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  created_at?: string | null;
};

export type ClientMatch = {
  id: string;
  client_id: string;
  vehicle_id: string;
  match_type?: string | null; // ej: "whatsapp", "visita", "reservado", "vendido"
  notes?: string | null;
  created_at?: string | null;
  // joins
  vehicle?: any;
  client?: Client;
};

/**
 * Lista de clientes
 */
export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*');

  if (error) {
    console.error('Error cargando clients desde Supabase', error);
    throw new Error(error.message || 'Error cargando clientes');
  }

  return (data || []) as Client[];
}

/**
 * Cliente por id
 */
export async function fetchClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error cargando client por id', error);
    throw new Error(error.message || 'Error cargando cliente');
  }

  return (data || null) as Client | null;
}

/**
 * Búsquedas de un cliente (tabla search_requests)
 */
export async function fetchClientSearches(
  clientId: string
): Promise<ClientSearchRequest[]> {
  const { data, error } = await supabase
    .from('search_requests')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando search_requests', error);
    throw new Error(error.message || 'Error cargando búsquedas del cliente');
  }

  return (data || []) as ClientSearchRequest[];
}

/**
 * Matches de un cliente (tabla matches, unida a vehicles)
 */
export async function fetchClientMatches(
  clientId: string
): Promise<ClientMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      vehicle:vehicles(*),
      client:clients(*)
    `
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando matches (por cliente)', error);
    throw new Error(error.message || 'Error cargando matches del cliente');
  }

  return (data || []) as ClientMatch[];
}

/**
 * Matches de un vehículo (tabla matches, unida a clients)
 */
export async function fetchVehicleMatches(
  vehicleId: string
): Promise<ClientMatch[]> {
  const { data, error } = await supabase
    .from('matches')
    .select(
      `
      *,
      client:clients(*),
      vehicle:vehicles(*)
    `
    )
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error cargando matches (por vehículo)', error);
    throw new Error(error.message || 'Error cargando matches del vehículo');
  }

  return (data || []) as ClientMatch[];
}
