// App.tsx

// Este archivo ya no es el punto de entrada principal.
// Lo dejamos como “dummy” para evitar confusiones y errores de import.
import { Text, View, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        La app se monta desde expo-router (index.ts). 
      </Text>
      <Text style={styles.textSmall}>
        Esta pantalla solo existe como fallback.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  textSmall: {
    color: '#9ca3af',
    fontSize: 13,
    textAlign: 'center',
  },
});
