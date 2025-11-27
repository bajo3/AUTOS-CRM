// app/(tabs)/meli/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {
  useMeliItems,
  type SortMode,
} from '../../../src/features/crm/hooks/useMeliItems';
import MeliItemRow from '../../../src/components/meli/MeliItemRow';

import { useVehicles } from '../../../src/features/crm/hooks/useVehicles';
import { linkVehicleToMeli } from '../../../src/features/crm/api/vehicles';
import type { Vehicle } from '../../../src/features/crm/types';

export default function MeliItemsScreen() {
  const {
    items,
    loading,
    error,
    refreshing,
    reload,
    relistLoading,
    relistStep,
    closePublication,
    changePrice,
    relistPublication,
    canLoadMore,
    loadingMore,
    loadMore,
    sortMode,
    setSortMode,
  } = useMeliItems();

  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceItemId, setPriceItemId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');

  const {
    vehicles,
    loading: loadingVehicles,
    error: vehiclesError,
    reload: reloadVehicles,
  } = useVehicles();
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  const openPriceModal = (id: string) => {
    setPriceItemId(id);
    setPriceValue('');
    setPriceModalVisible(true);
  };

  const confirmPriceChange = async () => {
    if (!priceItemId) return;
    const parsed = Number(priceValue.replace(',', '.'));
    if (!parsed || parsed <= 0) {
      Alert.alert('Error', 'Ingresá un precio válido');
      return;
    }
    try {
      await changePrice(priceItemId, parsed);
      setPriceModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error cambiando precio');
    }
  };

  const handleChangeSort = (mode: SortMode) => {
    setSortMode(mode);
  };

  const openLinkModal = (itemId: string) => {
    setLinkingItemId(itemId);
    setLinkModalVisible(true);
    reloadVehicles();
  };

  const handleLinkToVehicle = async (vehicle: Vehicle) => {
    if (!linkingItemId) return;
    try {
      setLinking(true);
      await linkVehicleToMeli(vehicle.id, linkingItemId);
      Alert.alert(
        'Vinculado',
        `La publicación ${linkingItemId} ahora está vinculada al vehículo ${vehicle.title || vehicle.id}.`
      );
      setLinkModalVisible(false);
    } catch (e: any) {
      console.error('Error vinculando vehículo con ML', e);
      Alert.alert(
        'Error',
        e?.message || 'Error vinculando vehículo con publicación ML'
      );
    } finally {
      setLinking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicaciones MercadoLibre</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Barra de filtros / orden */}
      <View style={styles.sortBar}>
        <TouchableOpacity
          style={[
            styles.sortChip,
            sortMode === 'recent' && styles.sortChipActive,
          ]}
          onPress={() => handleChangeSort('recent')}
        >
          <Text
            style={[
              styles.sortChipText,
              sortMode === 'recent' && styles.sortChipTextActive,
            ]}
          >
            Más recientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortChip,
            sortMode === 'oldest' && styles.sortChipActive,
          ]}
          onPress={() => handleChangeSort('oldest')}
        >
          <Text
            style={[
              styles.sortChipText,
              sortMode === 'oldest' && styles.sortChipTextActive,
            ]}
          >
            Más viejas
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !items.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Cargando publicaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} />
          }
          renderItem={({ item }) => (
            <MeliItemRow
              item={item}
              onChangePrice={openPriceModal}
              onClose={(id) =>
                Alert.alert(
                  'Cerrar publicación',
                  '¿Seguro que querés cerrarla?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Cerrar',
                      style: 'destructive',
                      onPress: () => closePublication(id),
                    },
                  ]
                )
              }
              onRelist={(id) =>
                Alert.alert(
                  'Republicar',
                  '¿Seguro que querés republicar esta publicación?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Republicar',
                      onPress: () => relistPublication(id),
                    },
                  ]
                )
              }
              onLinkVehicle={openLinkModal}
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No hay publicaciones activas.</Text>
            ) : null
          }
          ListFooterComponent={
            canLoadMore ? (
              <View style={styles.listFooter}>
                {loadingMore ? (
                  <>
                    <ActivityIndicator size="small" color="#60a5fa" />
                    <Text style={styles.footerText}>Cargando más...</Text>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={loadMore}
                  >
                    <Text style={styles.loadMoreText}>Cargar más</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      )}

      {relistLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.overlayText}>
            {relistStep === 'closing'
              ? 'Cerrando publicación...'
              : relistStep === 'creating'
              ? 'Creando nueva publicación...'
              : 'Procesando...'}
          </Text>
        </View>
      )}

      {/* Modal para cambiar precio */}
      <Modal visible={priceModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar precio</Text>
            <TextInput
              placeholder="Nuevo precio"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
              value={priceValue}
              onChangeText={setPriceValue}
              style={styles.modalInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setPriceModalVisible(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={confirmPriceChange}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para vincular con vehículo */}
      <Modal visible={linkModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Vincular a un vehículo</Text>

            {vehiclesError ? (
              <Text style={styles.error}>{vehiclesError}</Text>
            ) : null}

            {loadingVehicles ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#60a5fa" />
                <Text style={styles.loadingText}>Cargando vehículos...</Text>
              </View>
            ) : (
              <FlatList
                data={vehicles}
                keyExtractor={(v) => v.id}
                style={{ maxHeight: 280, marginTop: 8 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.vehicleRow}
                    onPress={() => handleLinkToVehicle(item)}
                    disabled={linking}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehicleTitle}>
                        {item.title || item.slug || item.id}
                      </Text>
                      <Text style={styles.vehicleSubtitle}>
                        {item.brand || ''} {item.year ? `· ${item.year}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    No hay vehículos cargados en el CRM.
                  </Text>
                }
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setLinkModalVisible(false)}
                disabled={linking}
              >
                <Text style={styles.modalButtonTextSecondary}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sortBar: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  sortChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#020617',
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#2563eb',
  },
  sortChipText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#f9fafb',
    fontWeight: '700',
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
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
  },
  loadMoreText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 13,
  },
  footerText: {
    marginTop: 6,
    color: '#9ca3af',
    fontSize: 12,
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
  overlayText: {
    color: '#e5e7eb',
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  modalTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#020617',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#e5e7eb',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    marginLeft: 8,
  },
  modalButtonSecondary: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  modalButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
    fontSize: 13,
  },
  modalButtonTextSecondary: {
    color: '#e5e7eb',
    fontWeight: '500',
    fontSize: 13,
  },
  vehicleRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  vehicleTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  vehicleSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
});
