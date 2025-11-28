// app/(tabs)/crm/searches/index.tsx
// Pantalla para listar las búsquedas de todos los clientes y mostrar coincidencias con el stock.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSearchRequests } from '../../../../src/features/crm/hooks/useSearchRequests';
import { useVehicles } from '../../../../src/features/crm/hooks/useVehicles';
import { matchVehiclesToSearch } from '../../../../src/features/matching/matchLogic';

export default function SearchesScreen() {
  const { searches, loading, error, reload } = useSearchRequests();
  const { vehicles } = useVehicles();

  const renderItem = ({ item }: { item: any }) => {
    // Calcular coincidencias para esta búsqueda utilizando los vehículos actuales
    const matches = matchVehiclesToSearch(vehicles || [], item);
    const top = matches.slice(0, 3);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title || '(Sin título)'}</Text>
        <Text style={styles.cardSub}>{item.description || ''}</Text>
        <Text style={styles.cardMeta}>
          {item.brand || 'Cualquier marca'} ·
          {item.year_min ? ` desde ${item.year_min}` : ''}
          {item.year_max ? ` hasta ${item.year_max}` : ''}
          {typeof item.price_min === 'number' &&
            ` · $${item.price_min.toLocaleString('es-AR')}`}
          {typeof item.price_max === 'number' &&
            ` – $${item.price_max.toLocaleString('es-AR')}`}
        </Text>

        {matches.length > 0 ? (
          <View style={styles.matchesSection}>
            <Text style={styles.matchesTitle}>Coincidencias sugeridas:</Text>
            {top.map((m) => (
              <Text key={m.vehicle.id} style={styles.matchRow}>
                • {m.vehicle.title || m.vehicle.slug || m.vehicle.id} (puntaje{' '}
                {m.score})
              </Text>
            ))}
            {matches.length > top.length && (
              <Text style={styles.matchRow}>
                …y {matches.length - top.length} más
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noMatches}>
            No hay coincidencias con el stock
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Búsquedas de clientes</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !searches.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#60a5fa" />
          <Text style={styles.loadingText}>Cargando búsquedas…</Text>
        </View>
      ) : (
        <FlatList
          data={searches}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={reload}
              tintColor="#60a5fa"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No hay búsquedas creadas.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#050816',
  },
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
  loadingText: {
    marginTop: 8,
    color: '#9ca3af',
  },
  listContent: {
    paddingBottom: 16,
  },
  empty: {
    marginTop: 32,
    textAlign: 'center',
    color: '#9ca3af',
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '600',
  },
  cardSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  cardMeta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
  matchesSection: {
    marginTop: 8,
  },
  matchesTitle: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  matchRow: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  noMatches: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 12,
  },
});
