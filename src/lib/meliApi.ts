// Updated version of src/lib/meliApi.ts with missing functions implemented.
//
// This file retains all original logic for token management and item fetching,
// and adds helper functions to update an item's price and to close an item.

import { supabase } from './supabaseClient';

const MELI_APP_ID = process.env.EXPO_PUBLIC_MELI_APP_ID;
const MELI_CLIENT_SECRET = process.env.EXPO_PUBLIC_MELI_CLIENT_SECRET;
const MELI_SELLER_ID = process.env.EXPO_PUBLIC_MELI_SELLER_ID;

if (!MELI_APP_ID || !MELI_CLIENT_SECRET) {
  console.warn(
    '[meliApi] Falta EXPO_PUBLIC_MELI_APP_ID o EXPO_PUBLIC_MELI_CLIENT_SECRET en .env'
  );
}

type MeliTokenRow = {
  id: string;
  access_token: string;
  refresh_token: string;
  // epoch seconds o null
  expires_at: number | null;
};

// =======================
// Helpers internos Supabase
// =======================

async function getTokenRow(): Promise<MeliTokenRow | null> {
  const { data, error } = await supabase
    .from('meli_tokens')
    .select('*')
    .limit(1)
    .maybeSingle(); // 👈 si después querés, podés agregar order('updated_at', { ascending: false })

  if (error) {
    console.error('[meliApi] Error leyendo meli_tokens', error);
    throw new Error(error.message || 'Error leyendo meli_tokens');
  }

  if (!data) return null;
  return data as MeliTokenRow;
}

async function refreshMeliToken(row: MeliTokenRow): Promise<MeliTokenRow> {
  if (!row.refresh_token) {
    throw new Error(
      'No hay refresh_token para Mercado Libre, reautorizá la app.'
    );
  }
  if (!MELI_APP_ID || !MELI_CLIENT_SECRET) {
    throw new Error(
      'Faltan EXPO_PUBLIC_MELI_APP_ID o EXPO_PUBLIC_MELI_CLIENT_SECRET para refrescar el token.'
    );
  }

  console.log('[meliApi] Refrescando token de Mercado Libre...');

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: MELI_APP_ID,
    client_secret: MELI_CLIENT_SECRET,
    refresh_token: row.refresh_token,
  }).toString();

  const response = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    console.error('[meliApi] Error al refrescar token', json);
    const msg =
      json.error_description ||
      json.message ||
      'No se pudo refrescar el token de Mercado Libre';
    throw new Error(msg);
  }

  const newAccessToken: string = json.access_token;
  const newRefreshToken: string = json.refresh_token || row.refresh_token;
  const expiresIn: number = json.expires_in ?? 21600; // ~6hs
  const newExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;

  const { data, error } = await supabase
    .from('meli_tokens')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt,
    })
    .eq('id', row.id)
    .select('*')
    .single();

  if (error) {
    console.error('[meliApi] Error actualizando meli_tokens', error);
    throw new Error(error.message || 'Error actualizando meli_tokens');
  }

  const updated = data as MeliTokenRow;
  console.log('[meliApi] Token de Mercado Libre refrescado OK');
  return updated;
}

// =======================
// Tokens públicos
// =======================

export async function getMeliAccessToken(): Promise<string> {
  const row = await getTokenRow();
  if (!row) {
    throw new Error(
      'No se encontró ningún registro en meli_tokens. Tenés que hacer el flujo de autorización de Mercado Libre al menos una vez.'
    );
  }

  if (!row.expires_at) {
    // si todavía no manejás expires_at, usamos el token así
    return row.access_token;
  }

  const now = Math.floor(Date.now() / 1000);
  const safetyMargin = 60;

  if (row.expires_at <= now + safetyMargin) {
    const refreshed = await refreshMeliToken(row);
    return refreshed.access_token;
  }

  return row.access_token;
}

// =======================
// Wrapper genérico de fetch
// =======================

export async function meliFetch<T = any>(
  path: string,
  init?: RequestInit & { rawBody?: any }
): Promise<T> {
  const baseUrl = 'https://api.mercadolibre.com';

  const doRequest = async (accessToken: string) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    if (init?.headers) {
      Object.assign(headers, init.headers as any);
    }

    const body =
      init && 'rawBody' in init && init.rawBody !== undefined
        ? (init.rawBody as any)
        : init?.body;

    const res = await fetch(baseUrl + path, {
      ...init,
      headers,
      body,
    });

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      // puede venir vacío
    }

    return { res, data };
  };

  let token = await getMeliAccessToken();
  let { res, data } = await doRequest(token);

  // manejar token inválido + intentar refresh
  if (
    res.status === 401 &&
    data &&
    typeof data.message === 'string'
  ) {
    const msg = data.message.toLowerCase();
    const isInvalid =
      msg.includes('invalid token') || msg.includes('invalid access token');

    if (isInvalid) {
      console.warn('[meliApi] invalid access token → intentando refresh');
      const row = await getTokenRow();
      if (!row) {
        throw new Error(
          'Token de Mercado Libre inválido y no se encontró registro en meli_tokens.'
        );
      }

      const refreshed = await refreshMeliToken(row);
      token = refreshed.access_token;
      ({ res, data } = await doRequest(token));
    }
  }

  if (!res.ok) {
    console.error('[meliApi] Error en meliFetch', {
      status: res.status,
      data,
    });
    const msg = data?.error_description || data?.message || 'Error en Mercado Libre';
    throw new Error(msg);
  }

  return data as T;
}

// =======================
// SellerId dinámico (/users/me)
// =======================

async function getSellerId(): Promise<string> {
  // 1) Si está en .env, lo usamos
  if (MELI_SELLER_ID && MELI_SELLER_ID.trim()) {
    return MELI_SELLER_ID.trim();
  }

  // 2) Si no, preguntamos a ML quién es el usuario del token
  const me = await meliFetch<{ id: number }>('/users/me');
  if (!me?.id) {
    throw new Error(
      'No se pudo obtener el user_id desde /users/me. Verificá el token de ML.'
    );
  }

  return String(me.id);
}

// =======================
// Items activos del usuario
// =======================

type MeliSearchResponse = {
  results: string[]; // ids de ítems
  paging: {
    total: number;
    offset: number;
    limit: number;
    primary_results?: number;
  };
};

export type MeliItem = {
  id: string;
  title: string;
  price: number;
  thumbnail?: string;
  permalink?: string;
  start_time?: string;
  stop_time?: string;
  status?: string;
  [key: string]: any;
};

export type UserActiveItemsResult = {
  items: MeliItem[];
  paging: MeliSearchResponse['paging'];
};

/**
 * Devuelve las publicaciones activas del usuario.
 * Esto es lo que debería usar useMeliItems.
 */
export async function getUserActiveItems(params?: {
  sellerId?: string;
  limit?: number;
  offset?: number;
}): Promise<UserActiveItemsResult> {
  const sellerId = params?.sellerId ?? (await getSellerId());
  const limit = params?.limit ?? 50;
  const offset = params?.offset ?? 0;

  // 1) Buscar ids de items activos
  const search = await meliFetch<MeliSearchResponse>(
    `/users/${sellerId}/items/search?status=active&limit=${limit}&offset=${offset}`
  );

  console.log(
    '[ML] SEARCH RESPONSE',
    JSON.stringify(
      {
        sellerId,
        paging: search.paging,
        resultsCount: search.results?.length ?? 0,
      },
      null,
      2
    )
  );

  const ids = search.results || [];
  if (!ids.length) {
    return { items: [], paging: search.paging };
  }

  // 2) Traer detalles en bloques de hasta 20 ids
  const chunkSize = 20;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += chunkSize) {
    chunks.push(ids.slice(i, i + chunkSize));
  }

  const items: MeliItem[] = [];
  for (const chunk of chunks) {
    const query = chunk.join(',');
    const data = await meliFetch<any[]>(
      `/items?ids=${query}&attributes=id,title,price,thumbnail,permalink,start_time,stop_time,status,date_created`
    );

    // la API responde un array de { code, body }
    for (const entry of data) {
      if (entry && entry.body) {
        items.push(entry.body as MeliItem);
      }
    }
  }

  return {
    items,
    paging: search.paging,
  };
}

// =======================
// Nuevas funciones para modificar publicaciones
// =======================

/**
 * Actualiza el precio de un ítem en Mercado Libre.
 * @param itemId ID del ítem que se desea actualizar.
 * @param newPrice Nuevo valor de precio para la publicación.
 * @returns La respuesta de la API de Mercado Libre.
 */
export async function updateItemPrice(itemId: string, newPrice: number) {
  if (!itemId) {
    throw new Error('Debe proporcionar un ID de ítem válido');
  }
  if (!Number.isFinite(newPrice) || newPrice <= 0) {
    throw new Error('El precio debe ser un número mayor a cero');
  }
  const body = JSON.stringify({ price: newPrice });
  return await meliFetch(`/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    rawBody: body,
  });
}

/**
 * Cierra una publicación en Mercado Libre (cambia su estado a 'closed').
 * Según la API oficial, esto se hace mediante un PUT sobre el recurso /items/{item_id}
 * enviando el campo `status` con el valor `closed`.
 * @param itemId ID del ítem que se desea cerrar.
 * @returns La respuesta de la API de Mercado Libre.
 */
export async function closeItem(itemId: string) {
  if (!itemId) {
    throw new Error('Debe proporcionar un ID de ítem válido');
  }
  const body = JSON.stringify({ status: 'closed' });
  return await meliFetch(`/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    rawBody: body,
  });
}