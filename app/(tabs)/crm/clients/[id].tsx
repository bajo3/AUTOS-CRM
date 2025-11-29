// app/(tabs)/crm/clients/[id].tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import type { Client } from '../../../../src/features/crm/api/clients';
import {
  fetchClientById,
  updateClient,
  deleteClient,
} from '../../../../src/features/crm/api/clients';

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) {
      setError('Falta el ID del cliente.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClientById(String(id));
      if (!data) {
        setError('Cliente no encontrado');
        setClient(null);
      } else {
        setClient(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setEmail(data.email || '');
        setNotes(data.notes || '');
      }
    } catch (e: any) {
      console.error('Error cargando cliente', e);
      setError(e?.message || 'Error cargando cliente');
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!client || !id) return;
    if (!fullName.trim()) {
      Alert.alert('Atención', 'El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateClient(String(id), {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });
      setClient(updated);
      setIsEditing(false);
    } catch (e: any) {
      console.error('Error actualizando cliente', e);
      Alert.alert('Error', e?.message || 'Error actualizando cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Eliminar cliente',
      '¿Seguro que querés eliminar este cliente? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);
              await deleteClient(String(id));
              router.back();
            } catch (e: any) {
              console.error('Error eliminando cliente', e);
              Alert.alert('Error', e?.message || 'Error eliminando cliente');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleWhatsApp = () => {
    if (!client?.phone) {
      Alert.alert(
        'Sin teléfono',
        'Este cliente no tiene un teléfono cargado para WhatsApp.'
      );
      return;
    }

    const digits = client.phone.replace(/\D/g, '');
    if (!digits) {
      Alert.alert(
        'Teléfono inválido',
        'El teléfono del cliente no parece válido para WhatsApp.'
      );
      return;
    }

    const url = `https://wa.me/${digits}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo WhatsApp', err);
      Alert.alert(
        'Error',
        'No se pudo abrir WhatsApp. Verificá que esté instalado.'
      );
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#60a5fa" />
        <Text style={styles.loadingText}>Cargando cliente...</Text>
      </View>
    );
  }

  if (error || !client) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Cliente no encontrado'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{client.full_name || '(Sin nombre)'}</Text>
        {client.phone ? (
          <Text style={styles.subtitle}>{client.phone}</Text>
        ) : null}
      </View>

      {/* Botones principales debajo del header */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.whatsappButton]}
          onPress={handleWhatsApp}
          disabled={!client.phone}
        >
          <Text style={styles.actionText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => setIsEditing((prev) => !prev)}
          disabled={saving}
        >
          <Text style={styles.actionText}>
            {isEditing ? 'Cancelar' : 'Editar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
          disabled={saving}
        >
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Link a nueva búsqueda */}
      <View style={styles.section}>
        <Link
          href={{
            pathname: '/(tabs)/crm/clients/[id]/new-search',
            params: { id: client.id },
          }}
          asChild
        >
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>+ Nueva búsqueda</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Datos del cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos del cliente</Text>

        {isEditing ? (
          <>
            <Label>Nombre completo</Label>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nombre"
              placeholderTextColor="#6b7280"
            />

            <Label>Teléfono (formato para WhatsApp)</Label>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 5492494123456"
              placeholderTextColor="#6b7280"
              keyboardType="phone-pad"
            />

            <Label>Email</Label>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#6b7280"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Label>Notas</Label>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas internas"
              placeholderTextColor="#6b7280"
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#f9fafb" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <InfoRow label="Nombre" value={client.full_name} />
            <InfoRow label="Teléfono" value={client.phone} />
            <InfoRow label="Email" value={client.email} />
            <InfoRow label="Notas" value={client.notes} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

type InfoRowProps = {
  label: string;
  value?: string | null;
};

function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#050816' },
  centered: {
    flex: 1,
    backgroundColor: '#050816',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: { marginTop: 8, color: '#9ca3af' },
  error: {
    color: '#f97373',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#1d4ed8',
  },
  backButtonText: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f9fafb',
  },
  subtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  // fila de botones
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: '#22c55e',
  },
  editButton: {
    backgroundColor: '#334155',
  },
  deleteButton: {
    backgroundColor: '#b91c1c',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 13,
  },
  infoValue: {
    color: '#e5e7eb',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  secondaryButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    alignSelf: 'flex-start',
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 13,
  },
});
