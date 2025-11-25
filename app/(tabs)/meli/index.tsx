// app/(tabs)/meli/index.tsx

import { Link } from 'expo-router';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Placeholder: después esto viene de tu hook useMeliItems / API ML
const MOCK_ITEMS = [
  { id: 'MLA123456', title: 'Vento 2.0T DSG', price: 13500000 },
  { id: 'MLA654321', title: 'Cruze 1.4T LTZ', price: 11900000 },
];

export default function MeliItemsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicaciones MercadoLibre</Text>
      <Text style={styles.subtitle}>
        Más adelante conectamos todo con tu proyecto Meli-test.
      </Text>

      <FlatList
        data={MOCK_ITEMS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link
            href={{ pathname: '/(tabs)/meli/item/[id]', params: { id: item.id } }}
            style={styles.card}
          >
            <Text style={styles.code}>{item.id}</Text>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.price}>
              ${item.price.toLocaleString('es-AR')}
            </Text>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  listContent: { paddingBottom: 16 },
  card: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  code: { color: '#9ca3af', fontSize: 11, marginBottom: 2 },
  name: { color: '#e5e7eb', fontSize: 16, fontWeight: '600' },
  price: { color: '#93c5fd', fontSize: 14, marginTop: 2 },
});
