// src/features/crm/api/vehicleHistory.ts
import { supabase } from '../../../lib/supabaseClient';

export type VehicleEvent = {
  id: string;
  vehicle_id: string;
  type?: string | null;        // ej: "creado", "precio", "reserva", "venta", "ml_publicado"
  description?: string | null; // texto legible
  meta?: any;                   // json extra (opcional)
  created_at?: string | null;
};

export type VehicleFile = {
  id: string;
  vehicle_id: string;
  file_name: string;
  file_url: string;
  file_type?: string | null; // ej: "pdf", "imagen", "doc"
  notes?: string | null;
  created_at?: string | null;
};

export type VehicleHistory = {
  events: VehicleEvent[];
  files: VehicleFile[];
};

export async function fetchVehicleHistory(
  vehicleId: string
): Promise<VehicleHistory> {
  // Si no hay id, devolvemos vacío
  if (!vehicleId) {
    return { events: [], files: [] };
  }

  const [eventsRes, filesRes] = await Promise.all([
    supabase
      .from('vehicle_events')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false }),
    supabase
      .from('vehicle_files')
      .select('*')
      .eq('vehicle_id', vehicleId)
      .order('created_at', { ascending: false }),
  ]);

  if (eventsRes.error) {
    console.error('Error cargando vehicle_events', eventsRes.error);
    // Si querés que no rompa aunque no exista la tabla, podés devolver vacío:
    // return { events: [], files: filesRes.data || [] as VehicleFile[] };
    throw new Error(
      eventsRes.error.message ||
        'Error cargando historial de eventos del vehículo'
    );
  }

  if (filesRes.error) {
    console.error('Error cargando vehicle_files', filesRes.error);
    throw new Error(
      filesRes.error.message ||
        'Error cargando archivos adjuntos del vehículo'
    );
  }

  return {
    events: (eventsRes.data || []) as VehicleEvent[],
    files: (filesRes.data || []) as VehicleFile[],
  };
}
