// app/(tabs)/crm/clients/new.tsx
// Pantalla para crear un nuevo cliente y guardarlo en Supabase.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ⚠️ Asegurate de tener estas vars en tu .env / app.json (EXPO_PUBLIC_...)
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente de Supabase local para esta pantalla
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function NewClientScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!fullName.trim()) {
      Alert.alert('Falta el nombre', 'El nombre del cliente es obligatorio.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('clients').insert({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });

      if (error) {
        console.error('[NewClientScreen] Error creando cliente', error);
        Alert.alert(
          'Error',
          'No se pudo guardar el cliente. Probá de nuevo en un momento.'
        );
        return;
      }

      Alert.alert('Listo', 'Cliente creado correctamente.', [
        {
          text: 'OK',
          onPress: () => {
            // Volvemos al listado de clientes
            router.back();
          },
        },
      ]);
    } catch (err) {
      console.error('[NewClientScreen] Error inesperado', err);
      Alert.alert(
        'Error',
        'Ocurrió un error inesperado al guardar el cliente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nuevo cliente</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Nombre completo *</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Ej: Juan Pérez"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Ej: 2494..."
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="ejemplo@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej: busca SUV, tiene usado para entregar, etc."
          multiline
          numberOfLines={4}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
