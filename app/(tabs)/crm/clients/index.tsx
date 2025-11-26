// app/(tabs)/crm/clients/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Link } from 'expo-router';
import {
  fetchClients,
  type Client,
} from '../../../../src/features/crm/api/clients';

function formatInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function formatName(client: Client): string {
  return client.full_name || '(Sin nombre)';
}

function formatSubtitle(client: Client): string {
  const phone = client.phone || null;
  const email = client.email || null;
  const parts = [phone, email].filter(Boolean);
  return parts.join(' • ');
}

export default function ClientsListScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (e: any) {
      console.error('Error cargando clientes', e);
      setError(e?.message || 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (e: any) {
      console.error('Error recargando clientes', e);
      setError(e?.message || 'Error recargando clientes');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const renderItem = ({ item }: { item: Client }) => {
    const name = formatName(item);
    const subtitle = formatSubtitle(item);
    const initials = formatInitials(item.full_name);

    return (
      <Link
        href={{ pathname: '/(tabs)/crm/clients/[id]', params: { id: item.id } }}
        asChild
      >
        <TouchableOpacity style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {name}
            </Text>
            {subtitle ? (
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.cardNotes} numberOfLines={1}>
                {item.notes}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !clients.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            clients.length ? styles.listContent : styles.listEmptyContent
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} />
          }
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>
                No hay clientes cargados en la tabla "clients".
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
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  cardNotes: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
});
