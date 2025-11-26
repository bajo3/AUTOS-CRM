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
 * Matches de un cliente (tabla matches, unida a vehicles y clients)
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
 * Matches de un vehículo (tabla matches, unida a clients y vehicles)
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

/**
 * Crear un match cliente <-> vehículo
 */
export async function createClientMatch(input: {
  client_id: string;
  vehicle_id: string;
  match_type?: string | null;
  notes?: string | null;
}): Promise<ClientMatch> {
  const { data, error } = await supabase
    .from('matches')
    .insert({
      client_id: input.client_id,
      vehicle_id: input.vehicle_id,
      match_type: input.match_type ?? null,
      notes: input.notes ?? null,
    })
    .select(
      `
      *,
      client:clients(*),
      vehicle:vehicles(*)
    `
    )
    .single();

  if (error) {
    console.error('Error creando match', error);
    throw new Error(error.message || 'Error creando match');
  }

  return data as ClientMatch;
}

/**
 * Crear una búsqueda para un cliente
 */
export async function createClientSearch(input: {
  client_id: string;
  title?: string | null;
  description?: string | null;
  brand?: string | null;
  year_min?: number | null;
  year_max?: number | null;
  price_min?: number | null;
  price_max?: number | null;
}): Promise<ClientSearchRequest> {
  const { data, error } = await supabase
    .from('search_requests')
    .insert({
      client_id: input.client_id,
      title: input.title ?? null,
      description: input.description ?? null,
      brand: input.brand ?? null,
      year_min: input.year_min ?? null,
      year_max: input.year_max ?? null,
      price_min: input.price_min ?? null,
      price_max: input.price_max ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creando búsqueda', error);
    throw new Error(error.message || 'Error creando búsqueda');
  }

  return data as ClientSearchRequest;
}
