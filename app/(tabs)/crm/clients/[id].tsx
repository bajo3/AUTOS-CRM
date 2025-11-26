// app/(tabs)/crm/clients/[id].tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import {
  fetchClientById,
  fetchClientSearches,
  fetchClientMatches,
  type Client,
  type ClientSearchRequest,
  type ClientMatch,
} from '../../../../src/features/crm/api/clients';
import { formatPrice } from '../../../../src/features/crm/utils/formatPrice';

function formatInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [client, setClient] = useState<Client | null>(null);
  const [searches, setSearches] = useState<ClientSearchRequest[]>([]);
  const [matches, setMatches] = useState<ClientMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [clientData, searchData, matchData] = await Promise.all([
        fetchClientById(id),
        fetchClientSearches(id),
        fetchClientMatches(id),
      ]);

      if (!clientData) {
        setError('No se encontró el cliente.');
        setClient(null);
        setSearches([]);
        setMatches([]);
      } else {
        setClient(clientData);
        setSearches(searchData);
        setMatches(matchData);
      }
    } catch (e: any) {
      console.error('Error cargando detalle de cliente', e);
      setError(e?.message || 'Error cargando cliente');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Cargando cliente...</Text>
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Cliente no encontrado.'}</Text>
      </View>
    );
  }

  const initials = formatInitials(client.full_name);
  const name = client.full_name || '(Sin nombre)';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          {client.phone ? (
            <Text style={styles.meta}>{client.phone}</Text>
          ) : null}
          {client.email ? (
            <Text style={styles.meta}>{client.email}</Text>
          ) : null}
        </View>
      </View>

      {client.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas</Text>
          <Text style={styles.notes}>{client.notes}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Búsquedas ({searches.length})
          </Text>

          {id ? (
            <Link
              href={{
                pathname: '/(tabs)/crm/clients/[id]/new-search',
                params: { id: String(id) },
              }}
              asChild
            >
              <TouchableOpacity style={styles.chipButton}>
                <Text style={styles.chipButtonText}>Nueva búsqueda</Text>
              </TouchableOpacity>
            </Link>
          ) : null}
        </View>

        {searches.length === 0 ? (
          <Text style={styles.empty}>Este cliente no tiene búsquedas aún.</Text>
        ) : (
          searches.map((s) => (
            <View key={s.id} style={styles.searchCard}>
              <Text style={styles.searchTitle}>
                {s.title || 'Búsqueda sin título'}
              </Text>
              {s.description ? (
                <Text style={styles.searchDesc}>{s.description}</Text>
              ) : null}
              <View style={styles.searchMetaRow}>
                {s.brand ? (
                  <Text style={styles.searchMeta}>Marca: {s.brand}</Text>
                ) : null}
                {s.year_min || s.year_max ? (
                  <Text style={styles.searchMeta}>
                    Año: {s.year_min || '?'} - {s.year_max || '?'}
                  </Text>
                ) : null}
              </View>
              <View style={styles.searchMetaRow}>
                {s.price_min || s.price_max ? (
                  <Text style={styles.searchMeta}>
                    Presupuesto:{' '}
                    {formatPrice(s.price_min)} - {formatPrice(s.price_max)}
                  </Text>
                ) : null}
                {s.created_at ? (
                  <Text style={styles.searchMeta}>
                    {new Date(s.created_at).toLocaleDateString('es-AR')}
                  </Text>
                ) : null}
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Matches ({matches.length})
        </Text>
        {matches.length === 0 ? (
          <Text style={styles.empty}>
            Todavía no hay matches con vehículos para este cliente.
          </Text>
        ) : (
          matches.map((m) => {
            const v = m.vehicle;
            const title = v
              ? [v.brand, v.title, v.year].filter(Boolean).join(' ')
              : `Vehículo ${m.vehicle_id}`;
            const price = v ? formatPrice(v.price) : '-';

            return (
              <Link
                key={m.id}
                href={{
                  pathname: '/(tabs)/crm/vehicles/[id]',
                  params: { id: m.vehicle_id },
                }}
                asChild
              >
                <View style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <Text style={styles.matchTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <Text style={styles.matchPrice}>{price}</Text>
                  </View>
                  <View style={styles.matchMetaRow}>
                    {m.match_type ? (
                      <Text style={styles.matchMeta}>
                        Tipo: {m.match_type}
                      </Text>
                    ) : null}
                    {m.created_at ? (
                      <Text style={styles.matchMeta}>
                        {new Date(m.created_at).toLocaleString('es-AR')}
                      </Text>
                    ) : null}
                  </View>
                  {m.notes ? (
                    <Text style={styles.matchNotes} numberOfLines={2}>
                      {m.notes}
                    </Text>
                  ) : null}
                </View>
              </Link>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones (futuro)</Text>
        <Text style={styles.empty}>
          Acá después podemos agregar botones para:
        </Text>
        <Text style={styles.empty}>• Crear match con vehículo</Text>
        <Text style={styles.empty}>• Abrir WhatsApp directamente</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: { marginTop: 8, color: '#9ca3af' },
  error: { color: '#f97373', fontSize: 14, textAlign: 'center' },
  container: { flex: 1, backgroundColor: '#050816' },
  content: { padding: 16, paddingBottom: 32 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#e5e7eb',
    fontSize: 18,
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
  },
  name: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    color: '#9ca3af',
    fontSize: 13,
  },
  section: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#111827',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#1f2937',
  },
  chipButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
  notes: {
    color: '#d1d5db',
    fontSize: 13,
  },
  empty: {
    color: '#9ca3af',
    fontSize: 13,
  },
  searchCard: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  searchTitle: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  searchDesc: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 2,
  },
  searchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  searchMeta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  matchCard: {
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  matchTitle: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  matchPrice: {
    color: '#60a5fa',
    fontSize: 14,
    fontWeight: '700',
  },
  matchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  matchMeta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  matchNotes: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 4,
  },
});
