// app/(tabs)/meli/item/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function MeliItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Después: GET /items/:id usando tu cliente de la API de ML
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Publicación ML: {id}</Text>
      <Text style={styles.text}>
        Acá va el detalle de la publicación: precio, estado, fotos,
        paquete, fecha de publicación, etc.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  text: { fontSize: 14, color: '#d1d5db' },
});
