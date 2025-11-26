// src/lib/meliApi.ts
import { supabase } from './supabaseClient';

export const ML_API_BASE = 'https://api.mercadolibre.com';

export type MeliItem = {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  status: string;
  listing_type_id: string;
  date_created?: string;
  thumbnail?: string;
  permalink?: string;
  attributes?: any[];
};

let cachedToken: string | null = null;
let cachedExpiresAt: number | null = null;

async function getMeliAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedExpiresAt && now < cachedExpiresAt - 60) {
    return cachedToken;
  }

  const { data, error } = await supabase
    .from('meli_tokens')
    .select('access_token, expires_at')
    .eq('id', 'main')
    .single();

  if (error) {
    console.error('Error leyendo meli_tokens desde Supabase:', error);
    throw new Error('No se pudo leer el token de Mercado Libre (meli_tokens)');
  }

  if (!data || !data.access_token) {
    throw new Error('No hay access_token guardado en meli_tokens');
  }

  const token: string = (data as any).access_token;

  let expiresAt: number | null = null;
  const rawExpires: any = (data as any).expires_at;

  if (rawExpires != null) {
    if (typeof rawExpires === 'number') {
      expiresAt = rawExpires;
    } else if (typeof rawExpires === 'string') {
      const parsed = parseInt(rawExpires, 10);
      if (!Number.isNaN(parsed)) {
        expiresAt = parsed;
      }
    }
  }

  cachedToken = token;
  cachedExpiresAt = expiresAt;

  return token;
}

export async function meliFetch(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getMeliAccessToken();

  const baseHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const headers: HeadersInit = {
    ...baseHeaders,
    ...(options.headers || {}),
  };

  const url =
    path.startsWith('http') || path.startsWith('https')
      ? path
      : `${ML_API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data: any = null;
  let rawText: string | null = null;

  try {
    rawText = await res.text();
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    // no era JSON
  }

  if (!res.ok) {
    const msg =
      (data && (data.message || data.error)) ||
      rawText ||
      `HTTP ${res.status}`;
    console.error('Error en meliFetch', msg);
    throw new Error(msg);
  }

  return data;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i + 0, i + size));
  }
  return chunks;
}

export async function getItemsByIds(ids: string[]): Promise<MeliItem[]> {
  if (!ids.length) return [];

  const chunks = chunkArray(ids, 20);
  const results: MeliItem[] = [];

  for (const chunk of chunks) {
    const idsParam = chunk.join(',');
    const data = await meliFetch(
      `/items?ids=${encodeURIComponent(
        idsParam
      )}&attributes=id,title,price,currency_id,available_quantity,status,listing_type_id,date_created,thumbnail,permalink,attributes`
    );

    const arr: any[] = Array.isArray(data) ? data : [];
    for (const entry of arr) {
      const body = entry && entry.body;
      if (!body || !body.id) continue;

      results.push({
        id: body.id,
        title: body.title,
        price: body.price,
        currency_id: body.currency_id,
        available_quantity: body.available_quantity,
        status: body.status,
        listing_type_id: body.listing_type_id,
        date_created: body.date_created,
        thumbnail: body.thumbnail,
        permalink: body.permalink,
        attributes: body.attributes,
      });
    }
  }

  return results;
}

export async function getUserActiveItems(userId: string): Promise<MeliItem[]> {
  const search = await meliFetch(
    `/users/${userId}/items/search?status=active&limit=50&offset=0`
  );

  const ids: string[] = search?.results || [];
  if (!ids.length) return [];

  return getItemsByIds(ids);
}

export async function updateItemPrice(itemId: string, newPrice: number) {
  await meliFetch(`/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ price: newPrice }),
  });
}

export async function closeItem(itemId: string) {
  await meliFetch(`/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'closed' }),
  });
}
