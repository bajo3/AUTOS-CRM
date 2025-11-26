// app/(tabs)/crm/vehicles/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { fetchVehicleById } from '../../../../src/features/crm/api/vehicles';
import {
  fetchVehicleHistory,
  VehicleEvent,
  VehicleFile,
} from '../../../../src/features/crm/api/vehicleHistory';
import {
  fetchVehicleMatches,
  type ClientMatch,
} from '../../../../src/features/crm/api/clients';

const SCREEN_WIDTH = Dimensions.get('window').width;

function formatPrice(value?: number | null): string {
  if (!value || value <= 0) return '-';
  try {
    return value.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    });
  } catch {
    return `$${value.toLocaleString('es-AR')}`;
  }
}

function formatEventLabel(event: VehicleEvent): string {
  const type = (event.type || '').toLowerCase();

  if (type.includes('precio')) return 'Cambio de precio';
  if (type.includes('reserva')) return 'Reserva';
  if (type.includes('venta') || type.includes('vendido')) return 'Venta';
  if (type.includes('ml_') || type.includes('mercado')) return 'MercadoLibre';
  if (type.includes('creado') || type.includes('alta')) return 'Alta de vehículo';

  return event.type || 'Evento';
}

function cleanPhoneForWhatsApp(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, '');
  if (!digits) return null;

  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('0')) return '54' + digits.slice(1);
  return '54' + digits;
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [vehicle, setVehicle] = useState<any | null>(null);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [files, setFiles] = useState<VehicleFile[]>([]);
  const [matches, setMatches] = useState<ClientMatch[]>([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setHistoryLoading(true);
    setMatchesLoading(true);
    setError(null);
    setHistoryError(null);
    setMatchesError(null);

    try {
      const [vehicleData, history, matchesData] = await Promise.all([
        fetchVehicleById(id),
        fetchVehicleHistory(id),
        fetchVehicleMatches(id),
      ]);

      if (!vehicleData) {
        setError('No se encontró el vehículo.');
        setVehicle(null);
        setEvents([]);
        setFiles([]);
        setMatches([]);
      } else {
        setVehicle(vehicleData);
        setEvents(history.events || []);
        setFiles(history.files || []);
        setMatches(matchesData || []);
      }
    } catch (e: any) {
      console.error('Error cargando vehículo / historial / matches', e);
      const msg = e?.message || 'Error cargando vehículo';

      if (
        msg.toLowerCase().includes('vehicle_files') ||
        msg.toLowerCase().includes('vehicle_events') ||
        msg.toLowerCase().includes('historial')
      ) {
        setHistoryError(msg);
      } else if (msg.toLowerCase().includes('matches')) {
        setMatchesError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setHistoryLoading(false);
      setMatchesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !vehicle && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Cargando vehículo...</Text>
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || 'Vehículo no encontrado.'}</Text>
      </View>
    );
  }

  const title = [
    vehicle.brand || '',
    vehicle.title || '',
    vehicle.year ? String(vehicle.year) : '',
  ]
    .filter(Boolean)
    .join(' ');

  const priceLabel = formatPrice(vehicle.price ?? null);
  const mainImage =
    Array.isArray(vehicle.pictures) && vehicle.pictures.length
      ? vehicle.pictures[0]
      : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {mainImage ? (
        <Image source={{ uri: mainImage }} style={styles.mainImage} />
      ) : null}

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.price}>{priceLabel}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles</Text>

        {vehicle.Km != null && (
          <Text style={styles.item}>
            Kilometraje:{' '}
            <Text style={styles.itemValue}>
              {Number(vehicle.Km).toLocaleString('es-AR')} km
            </Text>
          </Text>
        )}

        {vehicle.Motor && (
          <Text style={styles.item}>
            Motor: <Text style={styles.itemValue}>{vehicle.Motor}</Text>
          </Text>
        )}

        {vehicle.Caja && (
          <Text style={styles.item}>
            Caja: <Text style={styles.itemValue}>{vehicle.Caja}</Text>
          </Text>
        )}

        {vehicle.Combustible && (
          <Text style={styles.item}>
            Combustible:{' '}
            <Text style={styles.itemValue}>{vehicle.Combustible}</Text>
          </Text>
        )}

        {vehicle.Puertas != null && (
          <Text style={styles.item}>
            Puertas:{' '}
            <Text style={styles.itemValue}>{vehicle.Puertas}</Text>
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links</Text>
        {vehicle.permalink && (
          <Text style={styles.item}>
            Publicación ML:{' '}
            <Text style={styles.itemValue}>{vehicle.permalink}</Text>
          </Text>
        )}
        {vehicle.slug && (
          <Text style={styles.item}>
            Slug interno:{' '}
            <Text style={styles.itemValue}>{vehicle.slug}</Text>
          </Text>
        )}
      </View>

      {/* HISTORIAL DE EVENTOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Historial</Text>

        {historyLoading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color="#60a5fa" />
            <Text style={styles.inlineLoadingText}>Cargando historial...</Text>
          </View>
        )}

        {historyError ? (
          <Text style={styles.errorSmall}>{historyError}</Text>
        ) : null}

        {!historyLoading && !historyError && events.length === 0 ? (
          <Text style={styles.empty}>
            Este vehículo todavía no tiene eventos en el historial.
          </Text>
        ) : null}

        {events.map((ev) => {
          const label = formatEventLabel(ev);
          const date = ev.created_at
            ? new Date(ev.created_at).toLocaleString('es-AR')
            : '';
          return (
            <View key={ev.id} style={styles.eventCard}>
              <Text style={styles.eventLabel}>{label}</Text>
              {ev.description ? (
                <Text style={styles.eventDescription}>{ev.description}</Text>
              ) : null}
              {date ? (
                <Text style={styles.eventDate}>{date}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* ARCHIVOS ADJUNTOS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Archivos adjuntos</Text>

        {!historyLoading && !historyError && files.length === 0 ? (
          <Text style={styles.empty}>
            Todavía no hay archivos cargados para este vehículo.
          </Text>
        ) : null}

        {files.map((file) => {
          const date = file.created_at
            ? new Date(file.created_at).toLocaleDateString('es-AR')
            : '';
          const typeLabel = file.file_type || 'archivo';

          const handleOpen = () => {
            if (file.file_url) {
              Linking.openURL(file.file_url).catch((err) =>
                console.error('Error abriendo archivo', err)
              );
            }
          };

          return (
            <TouchableOpacity
              key={file.id}
              style={styles.fileCard}
              onPress={handleOpen}
              disabled={!file.file_url}
            >
              <View style={styles.fileIcon}>
                <Text style={styles.fileIconText}>
                  {typeLabel.toUpperCase().slice(0, 3)}
                </Text>
              </View>
              <View style={styles.fileContent}>
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.file_name}
                </Text>
                <View style={styles.fileMetaRow}>
                  {typeLabel ? (
                    <Text style={styles.fileMeta}>{typeLabel}</Text>
                  ) : null}
                  {date ? (
                    <Text style={styles.fileMeta}>{date}</Text>
                  ) : null}
                </View>
                {file.notes ? (
                  <Text style={styles.fileNotes} numberOfLines={1}>
                    {file.notes}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CLIENTES INTERESADOS / MATCHES */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            Clientes interesados ({matches.length})
          </Text>

          {id ? (
            <Link
              href={{
                pathname: '/(tabs)/crm/vehicles/[id]/new-match',
                params: { id: String(id) },
              }}
              asChild
            >
              <TouchableOpacity style={styles.chipButton}>
                <Text style={styles.chipButtonText}>Agregar match</Text>
              </TouchableOpacity>
            </Link>
          ) : null}
        </View>

        {matchesLoading && (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color="#60a5fa" />
            <Text style={styles.inlineLoadingText}>Cargando matches...</Text>
          </View>
        )}

        {matchesError ? (
          <Text style={styles.errorSmall}>{matchesError}</Text>
        ) : null}

        {!matchesLoading && !matchesError && matches.length === 0 ? (
          <Text style={styles.empty}>
            Este vehículo todavía no tiene clientes asociados en matches.
          </Text>
        ) : null}

        {matches.map((m) => {
          const c = m.client;
          const name = c?.full_name || 'Cliente sin nombre';
          const phone = c?.phone || '';
          const matchType = m.match_type || 'interés';
          const notes = m.notes || '';
          const date = m.created_at
            ? new Date(m.created_at).toLocaleString('es-AR')
            : '';

          const waPhone = cleanPhoneForWhatsApp(phone);
          const canWhatsapp = !!waPhone;

          const handleWhatsApp = () => {
            if (!waPhone) return;
            const text = encodeURIComponent(
              `Hola ${name}, te escribo por el ${title}.`
            );
            const url = `https://wa.me/${waPhone}?text=${text}`;
            Linking.openURL(url).catch((err) =>
              console.error('Error abriendo WhatsApp', err)
            );
          };

          return (
            <View key={m.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchName} numberOfLines={1}>
                  {name}
                </Text>
                {phone ? (
                  <Text style={styles.matchPhone}>{phone}</Text>
                ) : null}
              </View>
              <View style={styles.matchMetaRow}>
                <Text style={styles.matchMeta}>Tipo: {matchType}</Text>
                {date ? <Text style={styles.matchMeta}>{date}</Text> : null}
              </View>
              {notes ? (
                <Text style={styles.matchNotes} numberOfLines={2}>
                  {notes}
                </Text>
              ) : null}

              {canWhatsapp && (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={handleWhatsApp}
                >
                  <Text style={styles.whatsappText}>WhatsApp</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
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
  mainImage: {
    width: SCREEN_WIDTH - 32,
    height: (SCREEN_WIDTH - 32) * 0.6,
    borderRadius: 12,
    backgroundColor: '#020617',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#60a5fa',
    marginBottom: 12,
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
  item: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 3,
  },
  itemValue: {
    color: '#e5e7eb',
    fontWeight: '500',
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  inlineLoadingText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  errorSmall: {
    color: '#f97373',
    fontSize: 12,
    marginBottom: 4,
  },
  empty: {
    color: '#9ca3af',
    fontSize: 13,
  },
  eventCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  eventLabel: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  eventDescription: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 2,
  },
  eventDate: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  fileCard: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  fileIconText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '700',
  },
  fileContent: {
    flex: 1,
  },
  fileName: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '600',
  },
  fileMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  fileMeta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  fileNotes: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  matchCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  matchName: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  matchPhone: {
    color: '#9ca3af',
    fontSize: 12,
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
  whatsappButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  whatsappText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
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
});
