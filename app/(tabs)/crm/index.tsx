// app/(tabs)/crm/index.tsx

import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function CrmHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CRM de Autos</Text>
      <Text style={styles.subtitle}>
        Gestioná clientes, búsquedas y vehículos.
      </Text>

      <View style={styles.links}>
        <Link href="/(tabs)/crm/clients" style={styles.link}>
          ➜ Ver clientes
        </Link>
        <Link href="/(tabs)/crm/searches" style={styles.link}>
          ➜ Ver búsquedas
        </Link>
        <Link href="/(tabs)/crm/vehicles" style={styles.link}>
          ➜ Ver vehículos
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 16 },
  links: { marginTop: 8 },
  link: {
    fontSize: 16,
    color: '#60a5fa',
    paddingVertical: 8,
  },
});
