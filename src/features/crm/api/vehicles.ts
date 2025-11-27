// src/features/crm/api/vehicles.ts
import { supabase } from '../../../lib/supabaseClient';
import type { Vehicle } from '../types';

/**
 * Trae todos los vehículos desde la tabla "vehicles".
 */
export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*');

  if (error) {
    console.error('Error cargando vehicles desde Supabase', error);
    throw new Error(error.message || 'Error cargando vehículos');
  }

  return (data || []) as Vehicle[];
}

/**
 * Trae un vehículo por id desde la tabla "vehicles".
 */
export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Error cargando vehicle por id', error);
    throw new Error(error.message || 'Error cargando vehículo');
  }

  return (data || null) as Vehicle | null;
}

/**
 * Crea un nuevo vehículo.
 * Asegurate de que el tipo Vehicle y la tabla "vehicles"
 * compartan la misma estructura de columnas.
 */
export async function createVehicle(
  payload: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .insert(payload as any)
    .select('*')
    .single();

  if (error) {
    console.error('Error creando vehículo', error);
    throw new Error(error.message || 'Error creando vehículo');
  }

  return data as Vehicle;
}

/**
 * Actualiza un vehículo existente.
 */
export async function updateVehicle(
  id: string,
  payload: Partial<Vehicle>
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update(payload as any)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error actualizando vehículo', error);
    throw new Error(error.message || 'Error actualizando vehículo');
  }

  return data as Vehicle;
}

/**
 * Elimina un vehículo.
 */
export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);

  if (error) {
    console.error('Error eliminando vehículo', error);
    throw new Error(error.message || 'Error eliminando vehículo');
  }
}

/**
 * Vincula un vehículo del CRM con una publicación de ML.
 * Requiere que la tabla "vehicles" tenga la columna "meli_item_id".
 */
export async function linkVehicleToMeli(
  vehicleId: string,
  meliItemId: string
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ meli_item_id: meliItemId } as any)
    .eq('id', vehicleId)
    .select('*')
    .single();

  if (error) {
    console.error('Error vinculando vehículo con publicación ML', error);
    throw new Error(
      error.message || 'Error vinculando vehículo con publicación ML'
    );
  }

  return data as Vehicle;
}

/**
 * Desvincula un vehículo de cualquier publicación ML.
 */
export async function unlinkVehicleFromMeli(
  vehicleId: string
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from('vehicles')
    .update({ meli_item_id: null } as any)
    .eq('id', vehicleId)
    .select('*')
    .single();

  if (error) {
    console.error('Error desvinculando vehículo de publicación ML', error);
    throw new Error(
      error.message || 'Error desvinculando vehículo de publicación ML'
    );
  }

  return data as Vehicle;
}
