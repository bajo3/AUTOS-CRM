// src/features/matching/matchLogic.ts

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
 * Normalización básica: minúsculas + sin acentos
 */
function normalizeBasic(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, ''); // quita acentos
}

/**
 * Normalización "fuerte": sin espacios, guiones, barras, guiones bajos, etc.
 * Ej:
 *  - "T-Cross"  -> "tcross"
 *  - "t cross"  -> "tcross"
 *  - "T CROSS"  -> "tcross"
 */
function normalizeLoose(value?: string | null): string {
  return normalizeBasic(value).replace(/[\s\-\_\/]+/g, '');
}

/**
 * Normaliza marca (ignora espacios y guiones)
 */
function normalizeBrand(value?: string | null): string {
  return normalizeLoose(value);
}

/**
 * Intenta inferir palabras clave de modelo a partir del título / descripción de la búsqueda.
 * Ej: "SUV tipo Fox Yaris C3" => ["suv", "fox", "yaris", "c3"]
 */
function extractSearchKeywords(search: any): string[] {
  const base = [search?.title, search?.description].filter(Boolean).join(' ');

  const cleaned = normalizeBasic(base);
  if (!cleaned) return [];

  const stopWords = new Set([
    'busca',
    'buscar',
    'cliente',
    'para',
    'tipo',
    'como',
    'un',
    'una',
    'auto',
    'autos',
    'chico',
    'chica',
    'grande',
  ]);

  const rawWords = cleaned.split(/\s+/);

  const unique = new Set<string>();

  for (const w of rawWords) {
    const trimmed = w.trim();
    if (!trimmed) continue;
    if (trimmed.length < 2) continue;
    if (stopWords.has(trimmed)) continue;

    unique.add(trimmed);
  }

  return Array.from(unique);
}

/**
 * Calcula el score de un vehículo contra una búsqueda.
 * Ponderación aproximada:
 * - Marca: hasta 30
 * - Modelo / texto: hasta 35
 * - Año: hasta 25
 * - Precio: hasta 20
 */
export function scoreVehicleAgainstSearch(
  vehicle: Vehicle,
  search: any
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  const vBrand = normalizeBrand(vehicle.brand);
  const vTitle = normalizeBasic(vehicle.title);
  const vModel = normalizeBasic(vehicle.model || '');
  const vYear = vehicle.year ?? null;
  const vPrice = vehicle.price ?? null;

  const sBrand = normalizeBrand(search?.brand || null);
  const sYearMin = (search?.year_min ?? null) as number | null;
  const sYearMax = (search?.year_max ?? null) as number | null;
  const sPriceMin = (search?.price_min ?? null) as number | null;
  const sPriceMax = (search?.price_max ?? null) as number | null;

  const keywords = extractSearchKeywords(search);

  // ---- Marca (hasta 30 puntos) ----
  if (sBrand && vBrand) {
    if (vBrand === sBrand) {
      score += 25;
      reasons.push('Misma marca');
    } else if (vBrand.includes(sBrand) || sBrand.includes(vBrand)) {
      score += 15;
      reasons.push('Marca similar');
    } else {
      reasons.push('Marca distinta a la buscada');
    }
  }

  // ---- Modelo / texto libre (hasta 35 puntos) ----
  if (keywords.length && (vTitle || vModel || vBrand)) {
    const vTextLoose = normalizeLoose(
      `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.title || ''}`
    );

    let hits = 0;

    for (const kw of keywords) {
      const kwLoose = normalizeLoose(kw);
      if (!kwLoose) continue;

      if (vTextLoose.includes(kwLoose)) {
        hits += 1;
      }
    }

    if (hits > 0) {
      // ⚙ Ajuste: subimos un poco el peso para que 1 keyword ya sea fuerte
      const kwScore = Math.min(35, 20 + hits * 8); // 1 kw => 28, 2 kw => 36(capea en 35)
      score += kwScore;
      reasons.push(`Coincidencia de modelo / texto (${hits} palabra(s) clave)`);
    } else if (sBrand && vBrand === sBrand) {
      reasons.push('Misma marca pero modelo no explícito en la búsqueda');
    }
  }

  // ---- Año (hasta 25 puntos) ----
  if (typeof vYear === 'number') {
    if (typeof sYearMin === 'number' && typeof sYearMax === 'number') {
      if (vYear >= sYearMin && vYear <= sYearMax) {
        score += 25;
        reasons.push(`Año dentro del rango ${sYearMin}-${sYearMax}`);
      } else if (
        (vYear >= sYearMin - 1 && vYear < sYearMin) ||
        (vYear > sYearMax && vYear <= sYearMax + 1)
      ) {
        score += 15;
        reasons.push(`Año cercano al rango ${sYearMin}-${sYearMax}`);
      }
    } else if (typeof sYearMin === 'number') {
      if (vYear >= sYearMin) {
        score += 22;
        reasons.push(`Año mayor o igual a ${sYearMin}`);
      } else if (vYear === sYearMin - 1) {
        score += 12;
        reasons.push(`Año cercano a ${sYearMin}`);
      }
    } else if (typeof sYearMax === 'number') {
      if (vYear <= sYearMax) {
        score += 22;
        reasons.push(`Año menor o igual a ${sYearMax}`);
      } else if (vYear === sYearMax + 1) {
        score += 12;
        reasons.push(`Año cercano a ${sYearMax}`);
      }
    }
  }

  // ---- Precio (hasta 20 puntos) ----
  if (typeof vPrice === 'number' && (sPriceMin != null || sPriceMax != null)) {
    const min = sPriceMin ?? 0;
    const max = sPriceMax ?? Number.POSITIVE_INFINITY;

    if (vPrice >= min && vPrice <= max) {
      score += 20;
      reasons.push('Precio dentro del rango buscado');
    } else {
      // Penalización suave si está hasta 10–15% fuera del rango
      const center = isFinite(max) ? (min + max) / 2 : min || vPrice;
      const diff = Math.abs(vPrice - center);
      const tolerance = center * 0.15; // 15%

      if (diff <= tolerance) {
        score += 10;
        reasons.push('Precio cercano al rango buscado');
      }
    }
  }

  // Redondear y clamp 0–100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  return {
    vehicle,
    score: finalScore,
    reasons,
  };
}

/**
 * Matchea un array de vehículos contra una búsqueda.
 * Reglas:
 * - Filtros "duros" por marca/año/precio si están definidos.
 * - minScore dinámico:
 *    - Si NO hay marca, año ni precio => minScore más bajo (20).
 *    - Si hay 1 filtro (p.ej. solo marca) => ~45.
 *    - Si hay 2–3 filtros => se mantiene alto (60).
 */
export function matchVehiclesToSearch(
  vehicles: Vehicle[],
  search: any,
  baseMinScore: number = 60
): MatchResult[] {
  if (!vehicles || !vehicles.length) return [];

  const sBrand = normalizeBrand(search?.brand || null);
  const sYearMin = (search?.year_min ?? null) as number | null;
  const sYearMax = (search?.year_max ?? null) as number | null;
  const sPriceMin = (search?.price_min ?? null) as number | null;
  const sPriceMax = (search?.price_max ?? null) as number | null;

  const hasBrand = !!sBrand;
  const hasYearRange = sYearMin != null || sYearMax != null;
  const hasPriceRange = sPriceMin != null || sPriceMax != null;

  const constraintCount = [hasBrand, hasYearRange, hasPriceRange].filter(
    Boolean
  ).length;

  // ⚙ minScore dinámico según lo "apretada" que está la búsqueda
  let effectiveMinScore = baseMinScore;
  if (constraintCount === 0) {
    // Solo texto (tu caso: "auto chico moby c3 fox corsa")
    effectiveMinScore = 20;
  } else if (constraintCount === 1) {
    effectiveMinScore = 45;
  } else if (constraintCount === 2) {
    effectiveMinScore = 55;
  } else {
    effectiveMinScore = baseMinScore; // 3 filtros: muy exigente
  }

  const results = vehicles
    .map((v) => scoreVehicleAgainstSearch(v, search))
    .filter((res) => {
      const v = res.vehicle;

      const vBrand = normalizeBrand(v.brand);
      const vYear = v.year ?? null;
      const vPrice = v.price ?? null;

      // --- Filtro duro por marca ---
      if (hasBrand && vBrand && vBrand !== sBrand) {
        return false;
      }

      // --- Filtro duro por año (±1 año de tolerancia) ---
      if (typeof vYear === 'number' && (sYearMin != null || sYearMax != null)) {
        if (sYearMin != null && vYear < sYearMin - 1) return false;
        if (sYearMax != null && vYear > sYearMax + 1) return false;
      }

      // --- Filtro duro por precio (±15%) ---
      if (typeof vPrice === 'number' && (sPriceMin != null || sPriceMax != null)) {
        const minAllowed =
          sPriceMin != null ? sPriceMin * 0.85 : vPrice; // si no hay min, no restringe por abajo
        const maxAllowed =
          sPriceMax != null ? sPriceMax * 1.15 : vPrice; // si no hay max, no restringe por arriba

        if (vPrice < minAllowed || vPrice > maxAllowed) {
          return false;
        }
      }

      // --- Filtro por score mínimo dinámico ---
      return res.score >= effectiveMinScore;
    })
    .sort((a, b) => b.score - a.score);

  return results;
}
