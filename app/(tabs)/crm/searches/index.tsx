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
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { useSearchRequests } from '../../../../src/features/crm/hooks/useSearchRequests';
import type { SearchWithClient } from '../../../../src/features/crm/hooks/useSearchRequests';
import { useVehicles } from '../../../../src/features/crm/hooks/useVehicles';
import { matchVehiclesToSearch } from '../../../../src/features/matching/matchLogic';
import { deleteClientSearch } from '../../../../src/features/crm/api/clients';

function getScoreLabel(score: number): string {
  if (score >= 80) return 'ALTO';
  if (score >= 60) return 'MEDIO';
  return 'BAJO';
}

export default function SearchesScreen() {
  const { searches, loading, error, reload } = useSearchRequests();
  const { vehicles } = useVehicles();

  const handleDeleteSearch = (search: SearchWithClient) => {
    Alert.alert(
      'Eliminar búsqueda',
      `¿Seguro que querés eliminar la búsqueda "${search.title || ''}" del cliente ${search.client?.full_name || ''}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClientSearch(search.id);
              reload();
            } catch (e: any) {
              console.error('Error eliminando búsqueda', e);
              Alert.alert(
                'Error',
                e?.message || 'No se pudo eliminar la búsqueda'
              );
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SearchWithClient }) => {
    // Calcular coincidencias para esta búsqueda utilizando los vehículos actuales
    const matches = matchVehiclesToSearch(vehicles || [], item);
    const top = matches.slice(0, 3);

    const clientName = item.client?.full_name || '(Cliente sin nombre)';
    const clientPhone = item.client?.phone || null;

    const handleWhatsApp = () => {
      if (!clientPhone) return;
      const digits = clientPhone.replace(/\D/g, '');
      if (!digits) return;

      const url = `https://wa.me/${digits}`;
      Linking.openURL(url).catch((err) => {
        console.error('Error abriendo WhatsApp desde búsquedas', err);
      });
    };

    // Texto tipo “Busca Ecosport 2015” usando title, brand y años
    const searchTitle =
      item.title ||
      [
        item.brand || 'Cualquier marca',
        item.year_min ? `desde ${item.year_min}` : null,
        item.year_max ? `hasta ${item.year_max}` : null,
      ]
        .filter(Boolean)
        .join(' · ');

    return (
      <View style={styles.card}>
        {/* Header: cliente + botones */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName} numberOfLines={1}>
              Cliente: {clientName}
            </Text>
            {clientPhone ? (
              <Text style={styles.clientPhone} numberOfLines={1}>
                📞 {clientPhone}
              </Text>
            ) : (
              <Text style={styles.clientPhoneMuted}>
                Sin teléfono cargado
              </Text>
            )}
          </View>

          {/* Botones de acción */}
          <View style={styles.headerActions}>
            {clientPhone ? (
              <TouchableOpacity
                style={styles.whatsappButton}
                onPress={handleWhatsApp}
              >
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteSearch(item)}
            >
              <Ionicons name="trash-outline" size={18} color="#fca5a5" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Descripción de la búsqueda */}
        <Text style={styles.cardTitle}>
          Busca: {searchTitle || '(Sin título)'}
        </Text>

        {item.description ? (
          <Text style={styles.cardSub}>{item.description}</Text>
        ) : null}

        <Text style={styles.cardMeta}>
          {item.brand || 'Cualquier marca'}
          {item.year_min ? ` · desde ${item.year_min}` : ''}
          {item.year_max ? ` · hasta ${item.year_max}` : ''}
          {typeof item.price_min === 'number'
            ? ` · mín $${item.price_min.toLocaleString('es-AR')}`
            : ''}
          {typeof item.price_max === 'number'
            ? ` · máx $${item.price_max.toLocaleString('es-AR')}`
            : ''}
        </Text>

        {/* Coincidencias */}
        {matches.length > 0 ? (
          <View style={styles.matchesSection}>
            <View style={styles.matchesHeader}>
              <Text style={styles.matchesTitle}>Coincidencias sugeridas</Text>
              <Text style={styles.matchesCount}>
                {matches.length} en total
              </Text>
            </View>
            {top.map((m) => {
              const v = m.vehicle;
              const scoreLabel = getScoreLabel(m.score);
              return (
                <Text key={v.id} style={styles.matchRow}>
                  • {v.brand || ''} {v.model || v.title}{' '}
                  {v.year ? `(${v.year})` : ''}{' '}
                  {typeof v.price === 'number'
                    ? `– $${v.price.toLocaleString('es-AR')}`
                    : ''}
                  {`  (${m.score}/100 · ${scoreLabel})`}
                </Text>
              );
            })}
            {matches.length > top.length && (
              <Text style={styles.matchRow}>
                …y {matches.length - top.length} más
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noMatches}>
            No hay coincidencias con el stock.
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  clientName: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  clientPhone: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  clientPhoneMuted: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whatsappButton: {
    padding: 6,
    marginLeft: 8,
    borderRadius: 999,
    backgroundColor: '#064e3b',
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6,
    borderRadius: 999,
    backgroundColor: '#451a1a',
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  cardSub: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  cardMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  matchesSection: {
    marginTop: 8,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  matchesTitle: {
    color: '#60a5fa',
    fontSize: 13,
    fontWeight: '600',
  },
  matchesCount: {
    color: '#9ca3af',
    fontSize: 11,
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
