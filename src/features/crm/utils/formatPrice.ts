// src/features/crm/utils/formatPrice.ts
export function formatPrice(value?: number | null): string {
  if (value == null || Number.isNaN(Number(value)) || value <= 0) return '-';
  try {
    return Number(value).toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${Number(value).toLocaleString('es-AR')}`;
  }
}
