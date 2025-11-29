// src/features/crm/api/matches.ts
import { supabase } from '../../../lib/supabaseClient';

export type MatchStatus = 'interested' | 'contacted' | 'sold';

export type MatchRow = {
  id: string;
  client_id: string;
  vehicle_id: string;
  search_id: string | null;
  status: MatchStatus;
  created_at: string;
};

type CreateMatchInput = {
  clientId: string;
  vehicleId: string;
  searchId?: string | null;
  status?: MatchStatus;
};

// Crear un match simple (cliente interesado en vehículo)
export async function createMatch(
  input: CreateMatchInput
): Promise<MatchRow> {
  const { clientId, vehicleId, searchId = null, status = 'interested' } = input;

  const { data, error } = await supabase
    .from('matches')
    .insert({
      client_id: clientId,
      vehicle_id: vehicleId,
      search_id: searchId,
      status,
    })
    .select('*')
    .single<MatchRow>();

  if (error) {
    console.error('[matches] Error createMatch', error);
    throw new Error(error.message || 'Error creando match');
  }

  return data;
}

export async function listMatchesByVehicle(
  vehicleId: string
): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[matches] Error listMatchesByVehicle', error);
    throw new Error(error.message || 'Error cargando matches');
  }

  return (data || []) as MatchRow[];
}

export async function listMatchesByClient(
  clientId: string
): Promise<MatchRow[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[matches] Error listMatchesByClient', error);
    throw new Error(error.message || 'Error cargando matches');
  }

  return (data || []) as MatchRow[];
}
