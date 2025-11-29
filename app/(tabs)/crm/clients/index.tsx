// app/(tabs)/crm/clients/index.tsx
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
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';

import { useClients } from '../../../../src/features/crm/hooks/useClients';
import type { Client } from '../../../../src/features/crm/api/clients';
import { useClientHasMatches } from '../../../../src/features/crm/hooks/useClientHasMatches';

export default function ClientsScreen() {
  const { clients, loading, error, reload } = useClients();
  const router = useRouter();

  const handleOpenDetail = (client: Client) => {
    router.push({
      pathname: '/(tabs)/crm/clients/[id]',
      params: { id: client.id },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header simple */}
      <Text style={styles.title}>Clientes</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && !clients.length ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={reload}
          renderItem={({ item }) => (
            <ClientRow client={item} onPress={handleOpenDetail} />
          )}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.empty}>No hay clientes cargados.</Text>
            ) : null
          }
        />
      )}

      {/* FAB: Botón flotante + Cliente abajo a la derecha */}
      <View style={styles.fabContainer}>
        <Link href="/(tabs)/crm/clients/new" asChild>
          <TouchableOpacity style={styles.fab}>
            <Text style={styles.fabText}>+ Cliente</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

type RowProps = {
  client: Client;
  onPress: (client: Client) => void;
};

function ClientRow({ client, onPress }: RowProps) {
  const initials = (client.full_name || '?')
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2);

  // ¿Tiene matches este cliente?
  const { hasMatches } = useClientHasMatches(client.id);

  const handleWhatsApp = () => {
    if (!client.phone) return;

    const digits = client.phone.replace(/\D/g, '');
    if (!digits) return;

    const url = `https://wa.me/${digits}`;
    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo WhatsApp desde lista', err);
    });
  };

  const cardStyle = [
    styles.card,
    hasMatches && styles.cardHasMatch, // 👈 borde verde si tiene match
  ];

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onPress(client)}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials || '?'}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {client.full_name || '(Sin nombre)'}
        </Text>

        {client.phone ? (
          <Text style={styles.meta} numberOfLines={1}>
            📞 {client.phone}
          </Text>
        ) : null}

        {client.email ? (
          <Text style={styles.meta} numberOfLines={1}>
            ✉️ {client.email}
          </Text>
        ) : null}

        {/* Badge de matches disponibles */}
        {hasMatches && (
          <Text style={styles.matchBadge}>⚡ Matches disponibles</Text>
        )}
      </View>

      {/* Ícono de WhatsApp a la derecha si tiene teléfono */}
      {client.phone ? (
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
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
  loadingText: {
    marginTop: 8,
    color: '#9ca3af',
  },
  listContent: {
    paddingBottom: 80, // para que no tape el FAB
  },
  empty: {
    marginTop: 32,
    textAlign: 'center',
    color: '#9ca3af',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardHasMatch: {
    borderColor: '#22c55e', // borde verde cuando tiene match
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
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#f9fafb',
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  matchBadge: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#22c55e22',
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: '600',
  },
  whatsappButton: {
    padding: 6,
    marginLeft: 8,
    alignSelf: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  fab: {
    backgroundColor: '#3b82f6',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 4,
  },
  fabText: {
    color: '#f9fafb',
    fontWeight: '700',
    fontSize: 14,
  },
});
