// app/(tabs)/crm/vehicles/index.tsx

import { Link } from 'expo-router';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Placeholder de vehículos (después lo enchufamos con tu stock real / Supabase / ML)
const MOCK_VEHICLES = [
  { id: 'a1', title: 'Chevrolet Onix 1.4 LT', price: 7500000 },
  { id: 'b2', title: 'Volkswagen Vento 2.0T', price: 12500000 },
];

export default function VehiclesListScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículos en stock</Text>

      <FlatList
        data={MOCK_VEHICLES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link
            href={{ pathname: '/(tabs)/crm/vehicles/[id]', params: { id: item.id } }}
            style={styles.card}
          >
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
  price: { color: '#93c5fd', fontSize: 14, marginTop: 2 },
});
