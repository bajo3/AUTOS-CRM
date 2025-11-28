// app/(tabs)/vehicles/index.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useVehicles } from '../../../../src/features/crm/hooks/useVehicles';
import type { Vehicle } from '../../../../src/features/crm/types';

export default function VehiclesScreen() {
  const { vehicles, loading, error, reload } = useVehicles();
  const router = useRouter();

  const handleOpenDetail = (vehicle: Vehicle) => {
    router.push({
      pathname: '/(tabs)/crm/vehicles/[id]',
      params: { id: vehicle.id },
    });
  };


  return (
    <View style={styles.container}>
      {/* Header con título + botón nuevo auto */}
      <View style={styles.header}>
        <Text style={styles.title}>Autos en stock</Text>

        <Link href="/(tabs)/crm/vehicles/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Auto</Text>
          </TouchableOpacity>
        </Link>
      </View>

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
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={reload}
          renderItem={({ item }) => (
            <VehicleRow vehicle={item} onPress={handleOpenDetail} />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No hay vehículos cargados en el CRM.</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

type RowProps = {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
};

function VehicleRow({ vehicle, onPress }: RowProps) {
  const linked = !!(vehicle as any).meli_item_id;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(vehicle)}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {vehicle.title || vehicle.slug || vehicle.id}
          </Text>
          <Text style={styles.cardSub}>
            {vehicle.brand || 'Sin marca'} {vehicle.year ? `· ${vehicle.year}` : ''}
          </Text>
        </View>

        {typeof vehicle.price === 'number' && (
          <Text style={styles.cardPrice}>
            ${vehicle.price.toLocaleString('es-AR')}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        {linked ? (
          <View style={[styles.badge, styles.badgeLinked]}>
            <Text style={styles.badgeText}>Vinculado a ML</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeUnlinked]}>
            <Text style={styles.badgeText}>Sin ML</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
  },

  addButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  addButtonText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  cardPrice: {
    color: '#60a5fa',
    fontWeight: '700',
    marginLeft: 8,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
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
});
