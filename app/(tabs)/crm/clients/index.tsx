// app/(tabs)/crm/clients/index.tsx

import { Link } from 'expo-router';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Más adelante esto va a venir de Supabase / API
const MOCK_CLIENTS = [
  { id: '1', name: 'Juan Pérez', note: 'Busca sedán automático' },
  { id: '2', name: 'María López', note: 'SUV 7 asientos, usado' },
];

export default function ClientsListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clientes</Text>

      <FlatList
        data={MOCK_CLIENTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link
            href={{ pathname: '/(tabs)/crm/clients/[id]', params: { id: item.id } }}
            style={styles.card}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.note}>{item.note}</Text>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  listContent: { paddingBottom: 16 },
  card: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  name: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  note: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
});
