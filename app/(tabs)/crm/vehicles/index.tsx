// app/(tabs)/crm/vehicles/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Link } from 'expo-router';
import { fetchVehicles } from '../../../../src/features/crm/api/vehicles';

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

// brand + title + year
function formatTitle(vehicle: any): string {
  const brand = vehicle.brand || '';
  const title = vehicle.title || '';
  const year = vehicle.year ? String(vehicle.year) : '';

  return [brand, title, year].filter(Boolean).join(' ');
}

// Km • Motor • Caja • Combustible • Puertas
function formatSubtitle(vehicle: any): string {
  const km =
    vehicle.Km != null
      ? `${Number(vehicle.Km).toLocaleString('es-AR')} km`
      : null;
  const motor = vehicle.Motor || null;
  const caja = vehicle.Caja || null;
  const combustible = vehicle.Combustible || null;
  const puertas =
    vehicle.Puertas != null ? `${vehicle.Puertas} puertas` : null;

  const parts = [km, motor, caja, combustible, puertas].filter(Boolean);
  return parts.join(' • ');
}

export default function VehiclesListScreen() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (e: any) {
      console.error('Error cargando vehículos', e);
      setError(e?.message || 'Error cargando vehículos');
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (e: any) {
      console.error('Error recargando vehículos', e);
      setError(e?.message || 'Error recargando vehículos');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: any }) => {
    const title = formatTitle(item);
    const subtitle = formatSubtitle(item);
    const priceLabel = formatPrice(item.price ?? null);

    const thumbUri =
      Array.isArray(item.pictures) && item.pictures.length
        ? item.pictures[0]
        : null;

    return (
      <Link
        href={{ pathname: '/(tabs)/crm/vehicles/[id]', params: { id: item.id } }}
        asChild
      >
        <TouchableOpacity style={styles.card}>
          <View style={styles.row}>
            {thumbUri ? (
              <Image source={{ uri: thumbUri }} style={styles.thumb} />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={styles.thumbText}>AUTO</Text>
              </View>
            )}

            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {title}
                </Text>
                <Text style={styles.cardPrice}>{priceLabel}</Text>
              </View>

              {subtitle ? (
                <Text style={styles.cardSubtitle} numberOfLines={2}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículos en stock</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !vehicles.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Cargando vehículos...</Text>
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            vehicles.length ? styles.listContent : styles.listEmptyContent
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} />
          }
          renderItem={renderItem}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                No hay vehículos cargados en la tabla "vehicles".
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 12,
  },
  error: {
    color: '#f97373',
    fontSize: 13,
    marginBottom: 8,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 8, color: '#9ca3af' },
  listContent: {
    paddingBottom: 16,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#1f2937',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  cardPrice: {
    color: '#60a5fa',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
  },
});
