/// app/(tabs)/meli/index.tsx
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
import { useMeliItems } from '../../../src/features/crm/hooks/useMeliItems';
import MeliItemRow from '../../../src/components/meli/MeliItemRow';

export default function MeliItemsScreen() {
  const {
    items,
    loading,
    error,
    refreshing,
    reload,
    relistLoading,
    closePublication,
    changePrice,
  } = useMeliItems();

  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceItemId, setPriceItemId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicaciones MercadoLibre</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
            />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No hay publicaciones activas.</Text>
            ) : null
          }
        />
      )}

      {relistLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.overlayText}>Procesando...</Text>
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
  empty: {
    marginTop: 32,
    textAlign: 'center',
    color: '#9ca3af',
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
    gap: 8,
  },
  modalButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
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
});
