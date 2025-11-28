// app/(tabs)/vehicles/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Vehicle } from '../../../../src/features/crm/types';
import {
  fetchVehicleById,
  unlinkVehicleFromMeli,
} from '../../../../src/features/crm/api/vehicles';
import { closeItem, updateItemPrice } from '../../../../src/lib/meliApi';
import { useSearchRequests } from '../../../../src/features/crm/hooks/useSearchRequests';
import { matchVehiclesToSearch } from '../../../../src/features/matching/matchLogic';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { searches, loading: loadingSearches, error: searchesError } =
    useSearchRequests();

  const load = useCallback(async () => {
    if (!id) {
      setError('Falta el ID del vehículo.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicleById(id);
      if (!data) {
        setError('Vehículo no encontrado');
      } else {
        setVehicle(data);
      }
    } catch (e: any) {
      console.error('Error cargando vehículo', e);
      setError(e?.message || 'Error cargando vehículo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const meliItemId = (vehicle as any)?.meli_item_id as string | undefined;
  const linked = !!meliItemId;

  const handleOpenMeli = () => {
    if (!linked) {
      Alert.alert(
        'Sin ML',
        'Este vehículo no está vinculado a ninguna publicación de ML.'
      );
      return;
    }
    const permalink = (vehicle as any)?.permalink as string | undefined;
    if (!permalink) {
      Alert.alert(
        'Sin permalink',
        'No hay permalink guardado para este vehículo. Podés abrir la publicación desde la pestaña de ML.'
      );
      return;
    }
    Linking.openURL(permalink).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace.');
    });
  };

  const handleSyncPriceToMeli = async () => {
    if (!linked) {
      Alert.alert(
        'Sin ML',
        'Este vehículo no está vinculado a ninguna publicación de ML.'
      );
      return;
    }
    if (typeof vehicle?.price !== 'number' || vehicle.price <= 0) {
      Alert.alert(
        'Precio inválido',
        'El vehículo no tiene un precio válido cargado en el CRM.'
      );
      return;
    }
    try {
      setActionLoading(true);
      await updateItemPrice(meliItemId!, vehicle.price);
      Alert.alert('Listo', 'Se actualizó el precio en MercadoLibre.');
    } catch (e: any) {
      console.error('Error actualizando precio en ML', e);
      Alert.alert('Error', e?.message || 'Error actualizando precio en ML.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseMeli = async () => {
    if (!linked) {
      Alert.alert(
        'Sin ML',
        'Este vehículo no está vinculado a ninguna publicación de ML.'
      );
      return;
    }
    Alert.alert(
      'Cerrar publicación',
      '¿Seguro que querés cerrar la publicación en MercadoLibre?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await closeItem(meliItemId!);
              Alert.alert('Listo', 'Se cerró la publicación en MercadoLibre.');
            } catch (e: any) {
              console.error('Error cerrando publicación ML', e);
              Alert.alert(
                'Error',
                e?.message || 'Error cerrando publicación ML.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnlinkMeli = async () => {
    if (!linked || !vehicle) {
      Alert.alert('Sin ML', 'Este vehículo no está vinculado a ML.');
      return;
    }
    Alert.alert(
      'Desvincular de ML',
      '¿Seguro que querés quitar el vínculo con MercadoLibre? No se cerrará la publicación, solo se quitará la relación en el CRM.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const updated = await unlinkVehicleFromMeli(vehicle.id);
              setVehicle(updated);
              Alert.alert('Listo', 'Se desvinculó el vehículo de ML.');
            } catch (e: any) {
              console.error('Error desvinculando de ML', e);
              Alert.alert(
                'Error',
                e?.message || 'Error desvinculando de ML.'
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // --- Matches automáticos: este vehículo vs todas las búsquedas ---
  const topMatches = React.useMemo(() => {
    if (!vehicle || !searches || !searches.length) return [];

    const results =
      searches
        .map((search: any) => {
          const [match] = matchVehiclesToSearch([vehicle], search) || [];
          if (!match) return null;
          return {
            search,
            score: match.score,
          };
        })
        .filter(Boolean) as { search: any; score: number }[];

    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [vehicle, searches]);

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
        <Text style={styles.error}>{error || 'Vehículo no encontrado'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Text style={styles.title}>
        {vehicle.title || vehicle.slug || 'Vehículo'}
      </Text>
      <Text style={styles.subtitle}>{vehicle.brand || 'Sin marca'}</Text>

      <View style={styles.chipRow}>
        {vehicle.year && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>Año {vehicle.year}</Text>
          </View>
        )}
        {typeof vehicle.price === 'number' && vehicle.price > 0 && (
          <View style={styles.chip}>
            <Text style={styles.chipText}>
              ${vehicle.price.toLocaleString('es-AR')}
            </Text>
          </View>
        )}
      </View>

      {/* Badge de ML + alerta si no está vinculado */}
      <View style={[styles.chipRow, { marginTop: 12 }]}>
        {linked ? (
          <View style={[styles.badge, styles.badgeLinked]}>
            <Text style={styles.badgeText}>Vinculado a MercadoLibre</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeUnlinked]}>
            <Text style={styles.badgeText}>No vinculado a ML</Text>
          </View>
        )}
      </View>

      {!linked && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>
            Este vehículo no está vinculado a ML
          </Text>
          <Text style={styles.alertText}>
            Podés vincularlo desde la pestaña de MercadoLibre, usando el botón
            &quot;Vincular auto&quot; en la publicación correspondiente.
          </Text>
        </View>
      )}

      {/* Datos básicos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del vehículo</Text>
        <InfoRow label="ID" value={vehicle.id} />
        <InfoRow label="Marca" value={vehicle.brand} />
        <InfoRow label="Año" value={vehicle.year?.toString()} />
        <InfoRow label="Motor" value={(vehicle as any).Motor} />
        <InfoRow label="Caja" value={(vehicle as any).Caja} />
        <InfoRow label="Combustible" value={(vehicle as any).Combustible} />
        <InfoRow
          label="Kilómetros"
          value={
            typeof (vehicle as any).Km === 'number'
              ? (vehicle as any).Km.toLocaleString('es-AR') + ' km'
              : undefined
          }
        />
      </View>

      {/* Acciones ML */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MercadoLibre</Text>

        <TouchableOpacity
          style={[styles.actionButton, !linked && styles.actionButtonDisabled]}
          onPress={handleOpenMeli}
          disabled={!linked || actionLoading}
        >
          <Text style={styles.actionButtonText}>Ver en MercadoLibre</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !linked && styles.actionButtonDisabled]}
          onPress={handleSyncPriceToMeli}
          disabled={!linked || actionLoading}
        >
          <Text style={styles.actionButtonText}>
            Actualizar precio en ML
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !linked && styles.actionButtonDisabled]}
          onPress={handleCloseMeli}
          disabled={!linked || actionLoading}
        >
          <Text style={styles.actionButtonText}>
            Cerrar publicación en ML
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.actionButtonDanger,
            (!linked || actionLoading) && styles.actionButtonDisabled,
          ]}
          onPress={handleUnlinkMeli}
          disabled={!linked || actionLoading}
        >
          <Text style={styles.actionButtonText}>Desvincular de ML</Text>
        </TouchableOpacity>
      </View>

      {/* Matches automáticos: búsquedas/clientes que quieren algo similar */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Clientes que buscan algo similar
        </Text>

        {loadingSearches ? (
          <Text style={styles.loadingText}>Calculando coincidencias…</Text>
        ) : searchesError ? (
          <Text style={styles.error}>
            Error cargando búsquedas: {searchesError}
          </Text>
        ) : !topMatches.length ? (
          <Text style={styles.alertText}>
            No hay búsquedas que coincidan con este vehículo.
          </Text>
        ) : (
          topMatches.map(({ search, score }) => (
            <View key={search.id} style={styles.infoRow}>
              <Text style={styles.infoLabel}>
                {search.title || 'Búsqueda sin título'}
              </Text>
              <Text style={styles.infoValue}>Puntaje {score}</Text>
            </View>
          ))
        )}
      </View>

      {actionLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      )}
    </ScrollView>
  );
}

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
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
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginTop: 4,
  },
  chipText: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 6,
    marginTop: 4,
  },
  badgeLinked: {
    backgroundColor: '#16a34a33',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  badgeUnlinked: {
    backgroundColor: '#f9731633',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  badgeText: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '600',
  },
  alertBox: {
    marginTop: 12,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 10,
  },
  alertTitle: {
    color: '#fecaca',
    fontWeight: '700',
    fontSize: 13,
  },
  alertText: {
    color: '#fecaca',
    marginTop: 4,
    fontSize: 12,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
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
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1d4ed8',
  },
  actionButtonDanger: {
    backgroundColor: '#b91c1c',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(15,23,42,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
