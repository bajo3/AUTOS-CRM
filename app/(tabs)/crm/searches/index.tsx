// app/(tabs)/crm/searches/index.tsx

import { View, Text, StyleSheet } from 'react-native';

export default function SearchesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Búsquedas de clientes</Text>
      <Text style={styles.text}>
        Acá vamos a listar las búsquedas (presupuesto, tipo de auto, etc.)
        y hacer el match con tu stock.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  text: { fontSize: 14, color: '#d1d5db' },
});
