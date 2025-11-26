// src/features/crm/api/vehicles.ts
import { supabase } from '../../../lib/supabaseClient';
import type { Vehicle } from '../types';

/**
 * Trae todos los vehículos desde la tabla "vehicles".
 * No asumimos columnas específicas para evitar errores de columnas inexistentes.
 */
export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*'); // 👈 sin order('created_at')

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
