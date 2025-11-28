/// src/features/matching/matchLogic.ts

import type { Vehicle } from '../crm/types';

/**
 * Resultado de un match:
 * - vehicle: el vehículo del CRM
 * - score: puntaje 0–100
 * - reasons: motivos del puntaje (para debug o mostrar después)
 */
export type MatchResult = {
  vehicle: Vehicle;
  score: number;
  reasons: string[];
};

/**
 * Calcula el score de un vehículo contra una búsqueda.
 * La búsqueda puede venir de la tabla "search_requests" o similar.
 * No tipamos fuerte "search" a propósito para no pelear con tu tipo actual.
 */
function scoreVehicleAgainstSearch(vehicle: Vehicle, search: any): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const brandSearch = (search?.brand || '').toString().trim().toLowerCase();
  const brandVehicle = (vehicle as any).brand
    ? (vehicle as any).brand.toString().trim().toLowerCase()
    : '';

  const year = (vehicle as any).year as number | undefined;
  const price = (vehicle as any).price as number | undefined;

  const yearMin = (search?.year_min ?? undefined) as number | undefined;
  const yearMax = (search?.year_max ?? undefined) as number | undefined;
  const priceMin = (search?.price_min ?? undefined) as number | undefined;
  const priceMax = (search?.price_max ?? undefined) as number | undefined;

  // ---- Marca (hasta 40 puntos) ----
  if (brandSearch) {
    if (brandVehicle && brandVehicle === brandSearch) {
      score += 40;
      reasons.push(`Marca exacta: ${brandSearch}`);
    } else if (brandVehicle && brandVehicle.includes(brandSearch)) {
      score += 25;
      reasons.push(`Marca compatible: ${brandSearch}`);
    } else {
      // Marca distinta → penalizamos un poco
      score -= 10;
      reasons.push('Marca distinta a lo buscado');
    }
  }

  // ---- Año (hasta 30 puntos) ----
  if (typeof year === 'number') {
    if (typeof yearMin === 'number' && typeof yearMax === 'number') {
      if (year >= yearMin && year <= yearMax) {
        score += 30;
        reasons.push(`Año dentro del rango ${yearMin}-${yearMax}`);
      } else if (
        (year >= yearMin - 1 && year < yearMin) ||
        (year > yearMax && year <= yearMax + 1)
      ) {
        score += 15;
        reasons.push('Año cercano al rango pedido');
      } else {
        score -= 5;
        reasons.push('Año lejos de lo pedido');
      }
    } else if (typeof yearMin === 'number') {
      if (year >= yearMin) {
        score += 20;
        reasons.push(`Año desde ${yearMin} cumplido`);
      } else {
        score -= 5;
        reasons.push(`Año menor a ${yearMin}`);
      }
    } else if (typeof yearMax === 'number') {
      if (year <= yearMax) {
        score += 20;
        reasons.push(`Año hasta ${yearMax} cumplido`);
      } else {
        score -= 5;
        reasons.push(`Año mayor a ${yearMax}`);
      }
    }
  }

  // ---- Precio (hasta 30 puntos) ----
  if (typeof price === 'number') {
    if (typeof priceMin === 'number' && typeof priceMax === 'number') {
      if (price >= priceMin && price <= priceMax) {
        score += 30;
        reasons.push(
          `Precio dentro del rango $${priceMin.toLocaleString('es-AR')}–$${priceMax.toLocaleString('es-AR')}`
        );
      } else {
        // Penalizar según qué tan lejos está
        const center = (priceMin + priceMax) / 2;
        const diffPercent = Math.abs(price - center) / center;
        if (diffPercent < 0.1) {
          score += 20;
          reasons.push('Precio muy cercano al rango buscado');
        } else if (diffPercent < 0.25) {
          score += 10;
          reasons.push('Precio relativamente cercano al rango');
        } else {
          score -= 5;
          reasons.push('Precio lejos del rango de la búsqueda');
        }
      }
    } else if (typeof priceMin === 'number') {
      if (price >= priceMin) {
        score += 20;
        reasons.push(`Precio por encima de $${priceMin.toLocaleString('es-AR')}`);
      } else {
        score -= 5;
        reasons.push(`Precio por debajo de $${priceMin.toLocaleString('es-AR')}`);
      }
    } else if (typeof priceMax === 'number') {
      if (price <= priceMax) {
        score += 20;
        reasons.push(`Precio por debajo de $${priceMax.toLocaleString('es-AR')}`);
      } else {
        score -= 5;
        reasons.push(`Precio por encima de $${priceMax.toLocaleString('es-AR')}`);
      }
    }
  }

  // ---- Bonus si no hay filtros muy fuertes pero el auto es relativamente nuevo ----
  if (!brandSearch && !yearMin && !yearMax && !priceMin && !priceMax) {
    if (typeof year === 'number' && year >= 2018) {
      score += 15;
      reasons.push('Auto moderno (2018+), sin filtros estrictos');
    }
  }

  // Normalizar: mínimo 0
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return { vehicle, score, reasons };
}

/**
 * Dado un listado de vehículos y una búsqueda,
 * devuelve la lista de vehículos ordenada por mejor score.
 */
export function matchVehiclesToSearch(
  vehicles: Vehicle[],
  search: any,
  minScore: number = 10
): MatchResult[] {
  if (!vehicles || !vehicles.length) return [];

  const results = vehicles
    .map((v) => scoreVehicleAgainstSearch(v, search))
    // filtramos los que no llegan a un score mínimo (para no mostrar basura)
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return results;
}
