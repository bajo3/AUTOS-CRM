// app/(tabs)/crm/vehicles/[id]/new-match.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  fetchClients,
  type Client,
  createClientMatch,
} from '../../../../../src/features/crm/api/clients';

export default function NewMatchScreen() {
  const { id: vehicleId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [errorClients, setErrorClients] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [matchType, setMatchType] = useState<string>('interés');
  const [notes, setNotes] = useState<string>('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoadingClients(true);
    setErrorClients(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (e: any) {
      console.error('Error cargando clientes para match', e);
      setErrorClients(e?.message || 'Error cargando clientes');
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSave = async () => {
    if (!vehicleId) {
      Alert.alert('Error', 'Falta el ID del vehículo.');
      return;
    }
    if (!selectedClientId) {
      Alert.alert('Atención', 'Seleccioná un cliente.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await createClientMatch({
        client_id: selectedClientId,
        vehicle_id: String(vehicleId),
        match_type: matchType || null,
        notes: notes || null,
      });
      router.back();
    } catch (e: any) {
      console.error('Error guardando match', e);
      setSaveError(e?.message || 'Error guardando match');
    } finally {
      setSaving(false);
    }
  };

  const renderClient = ({ item }: { item: Client }) => {
    const isSelected = item.id === selectedClientId;
    const initials = (item.full_name || '?')
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('')
      .slice(0, 2);

    return (
      <TouchableOpacity
        style={[styles.clientCard, isSelected && styles.clientCardSelected]}
        onPress={() => setSelectedClientId(item.id)}
      >
        <View style={styles.clientAvatar}>
          <Text style={styles.clientAvatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName} numberOfLines={1}>
            {item.full_name || '(Sin nombre)'}
          </Text>
          {item.phone ? (
            <Text style={styles.clientMeta}>{item.phone}</Text>
          ) : null}
          {item.email ? (
            <Text style={styles.clientMeta}>{item.email}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo match</Text>
      <Text style={styles.subtitle}>
        Seleccioná el cliente interesado en este vehículo y opcionalmente
        agregá tipo y notas.
      </Text>

      <Text style={styles.sectionTitle}>Cliente</Text>

      {loadingClients ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.infoText}>Cargando clientes...</Text>
        </View>
      ) : errorClients ? (
        <Text style={styles.error}>{errorClients}</Text>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
          style={styles.clientList}
          contentContainerStyle={
            clients.length ? undefined : styles.clientListEmpty
          }
          ListEmptyComponent={
            <Text style={styles.infoText}>
              No hay clientes cargados en la tabla "clients".
            </Text>
          }
        />
      )}

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Detalle del match</Text>

        <Text style={styles.label}>Tipo (ej: interés, visita, reservado)</Text>
        <TextInput
          value={matchType}
          onChangeText={setMatchType}
          style={styles.input}
          placeholder="Tipo de match"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Notas (opcional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[styles.input, styles.inputMultiline]}
          placeholder="Notas internas sobre este match"
          placeholderTextColor="#6b7280"
          multiline
          numberOfLines={3}
        />

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#f9fafb" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar match</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816', padding: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e5e7eb',
    marginTop: 8,
    marginBottom: 6,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  infoText: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 6,
  },
  error: {
    color: '#f97373',
    fontSize: 13,
    marginTop: 4,
  },
  clientList: {
    maxHeight: 220,
  },
  clientListEmpty: {
    paddingVertical: 12,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  clientCardSelected: {
    borderWidth: 1,
    borderColor: '#60a5fa',
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  clientAvatarText: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  clientMeta: {
    color: '#9ca3af',
    fontSize: 11,
  },
  formSection: {
    marginTop: 12,
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
  saveButton: {
    marginTop: 12,
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
