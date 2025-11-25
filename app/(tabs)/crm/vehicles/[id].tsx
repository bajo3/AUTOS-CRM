// app/(tabs)/crm/vehicles/[id].tsx

import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Después: traer historial del auto, datos de pdf, estado, ML, etc.
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehículo #{id}</Text>
      <Text style={styles.text}>
        Pantalla de detalle del auto. Acá va el historial, fotos, estado,
        info de ML, PDF, etc.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  text: { fontSize: 14, color: '#d1d5db' },
});
