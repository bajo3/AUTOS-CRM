// src/features/matching/matchLogic.ts
// Lógica de matching entre búsquedas de clientes y vehículos del stock.
// Calcula una puntuación basada en coincidencias de marca, año y rango de precios.

import type { Vehicle } from '../crm/types';
import type { ClientSearchRequest } from '../crm/api/clients';

export interface MatchResult {
  vehicle: Vehicle;
  score: number;
}

/**
 * Calcula una puntuación de coincidencia entre un vehículo y una solicitud de búsqueda.
 * Aumenta la puntuación por cada criterio que coincida.
 */
function scoreVehicleForSearch(
  vehicle: Vehicle,
  search: ClientSearchRequest,
): number {
  let score = 0;
  // Coincidencia exacta de marca
  if (
    search.brand &&
    vehicle.brand &&
    vehicle.brand.toLowerCase() === search.brand.toLowerCase()
  ) {
    score += 3;
  }
  // Rango de año
  if (typeof vehicle.year === 'number') {
    if (search.year_min && vehicle.year >= search.year_min) score += 1;
    if (search.year_max && vehicle.year <= search.year_max) score += 1;
  }
  // Rango de precio
  if (typeof vehicle.price === 'number') {
    if (search.price_min && vehicle.price >= search.price_min) score += 1;
    if (search.price_max && vehicle.price <= search.price_max) score += 1;
  }
  return score;
}

/**
 * Devuelve una lista de vehículos ordenados por relevancia en función de una búsqueda.
 */
export function matchVehiclesToSearch(
  vehicles: Vehicle[],
  search: ClientSearchRequest,
): MatchResult[] {
  return vehicles
    .map((v) => ({ vehicle: v, score: scoreVehicleForSearch(v, search) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score);
}