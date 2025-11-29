// app/(tabs)/crm/vehicles/[id].tsx
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import type { Vehicle } from '../../../../src/features/crm/types';
import type {
  Client,
  ClientSearchRequest,
} from '../../../../src/features/crm/api/clients';

import { fetchVehicleById } from '../../../../src/features/crm/api/vehicles';
import { useSearchRequests } from '../../../../src/features/crm/hooks/useSearchRequests';
import { useClients } from '../../../../src/features/crm/hooks/useClients';
import { matchVehiclesToSearch } from '../../../../src/features/matching/matchLogic';
import {
  createMatch,
  listMatchesByVehicle,
  type MatchRow,
} from '../../../../src/features/crm/api/matches';

type VehicleMatchSuggestion = {
  search: ClientSearchRequest;
  client: Client | null;
  score: number;
};

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    searches,
    loading: searchesLoading,
    error: searchesError,
  } = useSearchRequests();
  const { clients } = useClients();

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [creatingMatchForSearchId, setCreatingMatchForSearchId] =
    useState<string | null>(null);

  const loadVehicle = useCallback(async () => {
    if (!id) {
      setError('Falta el ID del vehículo.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicleById(String(id));
      if (!data) {
        setError('Vehículo no encontrado');
        setVehicle(null);
      } else {
        setVehicle(data);
      }
    } catch (e: any) {
      console.error('Error cargando vehículo', e);
      setError(e?.message || 'Error cargando vehículo');
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMatches = useCallback(async (vehicleId: string) => {
    setMatchesLoading(true);
    try {
      const data = await listMatchesByVehicle(vehicleId);
      setMatches(data);
    } catch (e) {
      console.error('Error cargando matches del vehículo', e);
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicle();
  }, [loadVehicle]);

  useEffect(() => {
    if (vehicle?.id) {
      loadMatches(vehicle.id);
    }
  }, [vehicle?.id, loadMatches]);

  // --- Sugerencias de clientes que buscan algo similar (no son matches aún) ---
  const suggestions = useMemo<VehicleMatchSuggestion[]>(() => {
    if (!vehicle || !searches || !searches.length) return [];

    const list: VehicleMatchSuggestion[] = [];

    for (const search of searches) {
      const res = matchVehiclesToSearch([vehicle], search);
      if (!res || !res.length) continue;

      const match = res[0];
      const client =
        (clients || []).find(
          (c) => c.id === (search as any).client_id
        ) || null;

      list.push({
        search,
        client,
        score: match.score,
      });
    }

    list.sort((a, b) => b.score - a.score);
    return list.length > 10 ? list.slice(0, 10) : list;
  }, [vehicle, searches, clients]);

  const hasMatchForSuggestion = (s: VehicleMatchSuggestion) => {
    if (!vehicle || !s.client) return false;
    return matches.some(
      (m) =>
        m.vehicle_id === vehicle.id && m.client_id === s.client!.id
    );
  };

  const handleCreateMatchFromSuggestion = async (
    suggestion: VehicleMatchSuggestion
  ) => {
    if (!vehicle || !suggestion.client) return;

    try {
      setCreatingMatchForSearchId(suggestion.search.id);
      const created = await createMatch({
        clientId: suggestion.client.id,
        vehicleId: vehicle.id,
        searchId: suggestion.search.id,
        status: 'interested',
      });

      setMatches((prev) => {
        const exists = prev.some((m) => m.id === created.id);
        if (exists) return prev;
        return [created, ...prev];
      });

      Alert.alert(
        'Match creado',
        'Marcaste a este cliente como interesado en este vehículo.'
      );
    } catch (e: any) {
      console.error('Error creando match', e);
      Alert.alert(
        'Error',
        e?.message || 'No se pudo crear el match.'
      );
    } finally {
      setCreatingMatchForSearchId(null);
    }
  };

  const handleWhatsAppForSuggestion = (s: VehicleMatchSuggestion) => {
    const client = s.client;
    if (!client?.phone) {
      Alert.alert(
        'Sin teléfono',
        'Este cliente no tiene un teléfono cargado para WhatsApp.'
      );
      return;
    }
    if (!vehicle) return;

    const digits = client.phone.replace(/\D/g, '');
    if (!digits) {
      Alert.alert(
        'Teléfono inválido',
        'El teléfono del cliente no parece válido para WhatsApp.'
      );
      return;
    }

    const title =
      vehicle.title ||
      `${vehicle.brand || ''} ${vehicle.model || ''}`.trim() ||
      'el auto';
    const year = vehicle.year ? ` ${vehicle.year}` : '';
    const price =
      typeof vehicle.price === 'number'
        ? ` – $${vehicle.price.toLocaleString('es-AR')}`
        : '';

    const searchTitle = s.search.title || 'lo que estás buscando';

    const mensaje =
      `Hola ${client.full_name || ''}, tengo un auto que encaja con ` +
      `lo que me comentaste (${searchTitle}):\n\n` +
      `• ${title}${year}${price}`;

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(
      mensaje
    )}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo WhatsApp desde vehículo', err);
      Alert.alert(
        'Error',
        'No se pudo abrir WhatsApp. Verificá que esté instalado.'
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Cargando vehículo...</Text>
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>
          {error || 'Vehículo no encontrado'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const vAny = vehicle as any;
  const kmValue =
    typeof vAny.km === 'number'
      ? vAny.km
      : typeof vAny.Km === 'number'
      ? vAny.Km
      : null;

  const statusRaw = (vehicle as any).status as string | undefined;
  const status =
    statusRaw === 'sold'
      ? 'sold'
      : statusRaw === 'reserved'
      ? 'reserved'
      : 'available';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {vehicle.title ||
              `${vehicle.brand || ''} ${
                vehicle.model || ''
              }`.trim() ||
              'Vehículo'}
          </Text>
          {vehicle.year || vehicle.price ? (
            <Text style={styles.subtitle}>
              {vehicle.year ? `${vehicle.year} · ` : ''}
              {typeof vehicle.price === 'number'
                ? `$${vehicle.price.toLocaleString('es-AR')}`
                : ''}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusPill,
            status === 'sold'
              ? styles.statusSold
              : status === 'reserved'
              ? styles.statusReserved
              : styles.statusAvailable,
          ]}
        >
          <Text style={styles.statusPillText}>
            {status === 'sold'
              ? 'Vendido'
              : status === 'reserved'
              ? 'Reservado'
              : 'Disponible'}
          </Text>
        </View>
      </View>

      {/* Chips rápidos */}
      <View style={styles.chipRow}>
        {vehicle.brand ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{vehicle.brand}</Text>
          </View>
        ) : null}
        {vehicle.model ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{vehicle.model}</Text>
          </View>
        ) : null}
        {kmValue !== null ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              {kmValue.toLocaleString('es-AR')} km
            </Text>
          </View>
        ) : null}
      </View>

      {/* Datos básicos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del vehículo</Text>
        <InfoRow label="ID" value={vehicle.id} />
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Modelo" value={vehicle.model} />
        <InfoRow
          label="Versión"
          value={vAny.version || vAny.Version}
        />
        <InfoRow
          label="Año"
          value={vehicle.year ? String(vehicle.year) : undefined}
        />
        <InfoRow
          label="Kilómetros"
          value={
            kmValue !== null
              ? `${kmValue.toLocaleString('es-AR')} km`
              : undefined
          }
        />
        <InfoRow
          label="Color"
          value={vehicle.color || vAny.Color || vAny.color}
        />
        <InfoRow
          label="Motor"
          value={vehicle.engine || vAny.Motor || vAny.motor}
        />
        <InfoRow
          label="Caja"
          value={vehicle.transmission || vAny.Caja}
        />
        <InfoRow
          label="Combustible"
          value={vAny.Combustible || vAny.combustible}
        />
        <InfoRow
          label="Estado"
          value={
            status === 'sold'
              ? 'Vendido'
              : status === 'reserved'
              ? 'Reservado'
              : 'Disponible'
          }
        />
      </View>

      {/* Sugerencias automáticas (aún no son matches) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Sugerencias de clientes para este vehículo
        </Text>

        {searchesLoading ? (
          <Text style={styles.loadingText}>
            Calculando coincidencias…
          </Text>
        ) : searchesError ? (
          <Text style={styles.errorSmall}>
            Error cargando búsquedas: {searchesError}
          </Text>
        ) : !suggestions.length ? (
          <Text style={styles.alertText}>
            No hay búsquedas que coincidan con este vehículo.
          </Text>
        ) : (
          suggestions.map((s) => {
            const { client, search, score } = s;
            const clientName =
              client?.full_name || 'Cliente sin nombre';
            const phone = client?.phone || '';

            let badgeStyle = styles.badgeMedium;
            if (score >= 80) badgeStyle = styles.badgeHigh;
            else if (score < 50) badgeStyle = styles.badgeLow;

            const alreadyMatched = hasMatchForSuggestion(s);

            return (
              <View key={search.id} style={styles.matchCard}>
                <View style={styles.matchHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchClientName}>
                      {clientName}
                    </Text>
                    {phone ? (
                      <Text style={styles.matchClientPhone}>
                        {phone}
                      </Text>
                    ) : null}
                  </View>

                  <View style={styles.matchHeaderRight}>
                    <View style={[styles.scoreBadge, badgeStyle]}>
                      <Text style={styles.scoreBadgeText}>
                        {score}/100
                      </Text>
                    </View>

                    {client?.phone ? (
                      <TouchableOpacity
                        style={styles.whatsappIconButton}
                        onPress={() =>
                          handleWhatsAppForSuggestion(s)
                        }
                      >
                        <Ionicons
                          name="logo-whatsapp"
                          size={18}
                          color="#f9fafb"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                <Text style={styles.matchSearchTitle}>
                  {search.title || 'Búsqueda sin título'}
                </Text>

                <Text style={styles.matchSearchMeta}>
                  {search.brand || 'Cualquier marca'}
                  {search.year_min
                    ? ` · desde ${search.year_min}`
                    : ''}
                  {search.year_max
                    ? ` · hasta ${search.year_max}`
                    : ''}
                  {typeof search.price_min === 'number'
                    ? ` · mín $${search.price_min.toLocaleString(
                        'es-AR'
                      )}`
                    : ''}
                  {typeof search.price_max === 'number'
                    ? ` · máx $${search.price_max.toLocaleString(
                        'es-AR'
                      )}`
                    : ''}
                </Text>

                {search.description ? (
                  <Text style={styles.matchSearchDescription}>
                    {search.description}
                  </Text>
                ) : null}

                <View style={styles.suggestionActionsRow}>
                  {alreadyMatched ? (
                    <View
                      style={[
                        styles.matchCreatedBadge,
                        styles.badgeHigh,
                      ]}
                    >
                      <Text style={styles.matchCreatedText}>
                        Match creado
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.markMatchButton}
                      onPress={() =>
                        handleCreateMatchFromSuggestion(s)
                      }
                      disabled={
                        creatingMatchForSearchId === search.id
                      }
                    >
                      {creatingMatchForSearchId === search.id ? (
                        <ActivityIndicator
                          size="small"
                          color="#f9fafb"
                        />
                      ) : (
                        <Text style={styles.markMatchButtonText}>
                          Marcar interesado
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Matches reales guardados para este vehículo */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Clientes interesados (matches)
        </Text>

        {matchesLoading ? (
          <Text style={styles.loadingText}>
            Cargando matches…
          </Text>
        ) : !matches.length ? (
          <Text style={styles.alertText}>
            Todavía no hay matches creados para este vehículo.
          </Text>
        ) : (
          matches.map((m) => {
            const client =
              (clients || []).find(
                (c) => c.id === m.client_id
              ) || null;

            const clientName =
              client?.full_name || 'Cliente sin nombre';
            const phone = client?.phone || '';
            const statusLabel =
              m.status === 'sold'
                ? 'Vendido'
                : m.status === 'contacted'
                ? 'Contactado'
                : 'Interesado';

            return (
              <View key={m.id} style={styles.simpleMatchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.simpleMatchName}>
                    {clientName}
                  </Text>
                  {phone ? (
                    <Text style={styles.simpleMatchPhone}>
                      {phone}
                    </Text>
                  ) : null}
                  <Text style={styles.simpleMatchStatus}>
                    Estado match: {statusLabel}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

/** ==== Componentes auxiliares ==== */

type InfoRowProps = {
  label: string;
  value?: string | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },

  centered: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: { marginTop: 8, color: '#9ca3af' },
  error: {
    color: '#f97373',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSmall: {
    color: '#f97373',
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
  },
  backButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },

  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    color: '#f9fafb',
    fontSize: 11,
    fontWeight: '600',
  },
  statusAvailable: {
    backgroundColor: '#16a34a',
  },
  statusReserved: {
    backgroundColor: '#f59e0b',
  },
  statusSold: {
    backgroundColor: '#b91c1c',
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#111827',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '500',
  },

  section: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#111827',
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  alertText: {
    color: '#9ca3af',
    fontSize: 13,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  infoValue: {
    color: '#e5e7eb',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },

  // --- Tarjetas de sugerencias/matches ---
  matchCard: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  matchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchClientName: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  matchClientPhone: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    marginRight: 6,
  },
  scoreBadgeText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeHigh: {
    backgroundColor: '#16a34a',
  },
  badgeMedium: {
    backgroundColor: '#2563eb',
  },
  badgeLow: {
    backgroundColor: '#92400e',
  },
  whatsappIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
  },
  matchSearchTitle: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  matchSearchMeta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  matchSearchDescription: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },

  suggestionActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  markMatchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#3b82f6',
  },
  markMatchButtonText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },
  matchCreatedBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  matchCreatedText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },

  // Matches simples listados
  simpleMatchRow: {
    marginTop: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  simpleMatchName: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
  simpleMatchPhone: {
    color: '#9ca3af',
    fontSize: 12,
  },
  simpleMatchStatus: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
});
