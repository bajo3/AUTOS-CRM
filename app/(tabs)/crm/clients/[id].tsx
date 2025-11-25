// app/(tabs)/crm/clients/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Después: fetch real por ID desde Supabase
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cliente #{id}</Text>
      <Text style={styles.text}>
        Aquí va el detalle del cliente, sus búsquedas, matches con autos, etc.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  text: { fontSize: 14, color: '#d1d5db' },
});
