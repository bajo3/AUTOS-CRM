// app/(tabs)/crm/clients/[id]/new-search.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createClientSearch } from '../../../../../src/features/crm/api/clients';

export default function NewSearchScreen() {
  const { id: clientId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [yearMin, setYearMin] = useState<string>('');
  const [yearMax, setYearMax] = useState<string>('');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!clientId) {
      Alert.alert('Error', 'Falta el ID del cliente.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Atención', 'Poné un título para la búsqueda.');
      return;
    }

    const yearMinNum = yearMin ? Number(yearMin) : null;
    const yearMaxNum = yearMax ? Number(yearMax) : null;
    const priceMinNum = priceMin ? Number(priceMin) : null;
    const priceMaxNum = priceMax ? Number(priceMax) : null;

    setSaving(true);
    setError(null);

    try {
      await createClientSearch({
        client_id: String(clientId),
        title: title.trim(),
        description: description.trim() || null,
        brand: brand.trim() || null,
        year_min: yearMinNum,
        year_max: yearMaxNum,
        price_min: priceMinNum,
        price_max: priceMaxNum,
      });

      router.back();
    } catch (e: any) {
      console.error('Error creando búsqueda', e);
      setError(e?.message || 'Error creando búsqueda');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nueva búsqueda</Text>
      <Text style={styles.subtitle}>
        Registrá lo que está buscando este cliente: presupuesto, marca,
        rangos de año, etc.
      </Text>

      <Text style={styles.label}>Título *</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Ej: SUV hasta 8M, sedán 2018+"
        placeholderTextColor="#6b7280"
      />

      <Text style={styles.label}>Descripción (opcional)</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.inputMultiline]}
        placeholder="Más detalles: color preferido, caja, uso, etc."
        placeholderTextColor="#6b7280"
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Marca (opcional)</Text>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        style={styles.input}
        placeholder="Ej: Toyota, Ford..."
        placeholderTextColor="#6b7280"
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Año mínimo</Text>
          <TextInput
            value={yearMin}
            onChangeText={setYearMin}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 2015"
            placeholderTextColor="#6b7280"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Año máximo</Text>
          <TextInput
            value={yearMax}
            onChangeText={setYearMax}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 2022"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Precio mínimo</Text>
          <TextInput
            value={priceMin}
            onChangeText={setPriceMin}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 4000000"
            placeholderTextColor="#6b7280"
          />
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Precio máximo</Text>
          <TextInput
            value={priceMax}
            onChangeText={setPriceMax}
            style={styles.input}
            keyboardType="numeric"
            placeholder="Ej: 8000000"
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#f9fafb" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar búsqueda</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  label: {
    color: '#d1d5db',
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f9fafb',
    fontSize: 13,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  col: {
    flex: 1,
  },
  error: {
    color: '#f97373',
    fontSize: 13,
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
    backgroundColor: '#60a5fa',
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '700',
  },
});
