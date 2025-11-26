// src/features/crm/types.ts
export type VehicleStatus = 'available' | 'reserved' | 'sold' | 'deleted' | string;

export type Vehicle = {
  id: string;            // UUID o text
  stock_code?: string | null;
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  year?: number | null;
  km?: number | null;
  color?: string | null;
  transmission?: string | null;
  engine?: string | null;
  price?: number | null;
  status?: VehicleStatus | null;
  created_at?: string | null;
};
