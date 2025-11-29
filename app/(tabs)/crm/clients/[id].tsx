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
import { Ionicons } from '@expo/vector-icons';

import type {
  Client,
  ClientSearchRequest,
} from '../../../../src/features/crm/api/clients';
import {
  fetchClientById,
  updateClient,
  deleteClient,
  fetchClientSearches,
  deleteClientSearch,
} from '../../../../src/features/crm/api/clients';

import { useVehicles } from '../../../../src/features/crm/hooks/useVehicles';
import { matchVehiclesToSearch } from '../../../../src/features/matching/matchLogic';

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

  // Búsquedas del cliente
  const [searches, setSearches] = useState<ClientSearchRequest[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(false);
  const [searchesError, setSearchesError] = useState<string | null>(null);

  // Stock para calcular coincidencias
  const { vehicles } = useVehicles();

  const loadClient = useCallback(async () => {
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

  const loadSearches = useCallback(
    async (clientId: string) => {
      setSearchesLoading(true);
      setSearchesError(null);
      try {
        const data = await fetchClientSearches(clientId);
        setSearches(data);
      } catch (e: any) {
        console.error('Error cargando búsquedas del cliente', e);
        setSearchesError(
          e?.message || 'Error cargando las búsquedas de este cliente'
        );
        setSearches([]);
      } finally {
        setSearchesLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  useEffect(() => {
    if (client?.id) {
      loadSearches(client.id);
    }
  }, [client?.id, loadSearches]);

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

  const handleDeleteClient = () => {
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

  const handleDeleteSearch = (search: ClientSearchRequest) => {
    if (!search.id) return;
    Alert.alert(
      'Eliminar búsqueda',
      `¿Seguro que querés eliminar la búsqueda "${search.title || ''}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClientSearch(search.id);
              if (client?.id) {
                loadSearches(client.id);
              }
            } catch (e: any) {
              console.error('Error eliminando búsqueda', e);
              Alert.alert(
                'Error',
                e?.message || 'No se pudo eliminar la búsqueda'
              );
            }
          },
        },
      ]
    );
  };

  const handleWhatsAppForSearch = (
    search: ClientSearchRequest,
    matches: ReturnType<typeof matchVehiclesToSearch>
  ) => {
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

    const top = matches.slice(0, 3);
    const autosTexto =
      top.length > 0
        ? top
            .map((m) => {
              const v = m.vehicle;
              const titulo = v.title || `${v.brand || ''} ${v.model || ''}`.trim();
              const year = v.year ? ` ${v.year}` : '';
              const price =
                typeof v.price === 'number'
                  ? ` – $${v.price.toLocaleString('es-AR')}`
                  : '';
              return `• ${titulo}${year}${price}`;
            })
            .join('\n')
        : 'Por ahora no tengo nada exacto, pero sigo atento al stock.';

    const mensaje =
      `Hola ${client.full_name || ''}, ` +
      `te comparto opciones según lo que me comentaste: "${
        search.title || 'búsqueda'
      }".\n\n` +
      autosTexto;

    const url = `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;

    Linking.openURL(url).catch((err) => {
      console.error('Error abriendo WhatsApp desde búsqueda', err);
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{client.full_name || '(Sin nombre)'}</Text>
          {client.phone ? (
            <Text style={styles.subtitle}>{client.phone}</Text>
          ) : null}
        </View>

        {/* Botones rápidos en el header */}
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonWhatsapp]}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#f9fafb" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsEditing((prev) => !prev)}
          >
            <Ionicons
              name={isEditing ? 'close' : 'create-outline'}
              size={18}
              color="#f9fafb"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.headerButtonDanger]}
            onPress={handleDeleteClient}
          >
            <Ionicons name="trash-outline" size={18} color="#f9fafb" />
          </TouchableOpacity>
        </View>
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

      {/* Búsquedas de este cliente */}
      <View style={styles.section}>
        <View style={styles.searchesHeader}>
          <Text style={styles.sectionTitle}>Búsquedas de este cliente</Text>
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

        {searchesLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator size="small" color="#60a5fa" />
            <Text style={styles.loadingText}>Cargando búsquedas…</Text>
          </View>
        ) : null}

        {searchesError ? (
          <Text style={styles.errorSmall}>{searchesError}</Text>
        ) : null}

        {!searchesLoading && searches.length === 0 ? (
          <Text style={styles.emptyText}>
            Este cliente todavía no tiene búsquedas guardadas.
          </Text>
        ) : null}

        {searches.map((search) => {
          const matches = matchVehiclesToSearch(vehicles || [], search);
          const top = matches.slice(0, 2);

          return (
            <View key={search.id} style={styles.searchCard}>
              <View style={styles.searchHeaderRow}>
                <Text style={styles.searchTitle}>
                  {search.title || '(Sin título)'}
                </Text>
                <View style={styles.searchActionsRow}>
                  {matches.length > 0 && client.phone ? (
                    <TouchableOpacity
                      style={styles.searchIconButton}
                      onPress={() => handleWhatsAppForSearch(search, matches)}
                    >
                      <Ionicons
                        name="logo-whatsapp"
                        size={18}
                        color="#25D366"
                      />
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.searchIconButton, styles.searchDeleteButton]}
                    onPress={() => handleDeleteSearch(search)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#fca5a5" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.searchMeta}>
                {search.brand || 'Cualquier marca'}
                {search.year_min ? ` · desde ${search.year_min}` : ''}
                {search.year_max ? ` · hasta ${search.year_max}` : ''}
                {typeof search.price_min === 'number'
                  ? ` · mín $${search.price_min.toLocaleString('es-AR')}`
                  : ''}
                {typeof search.price_max === 'number'
                  ? ` · máx $${search.price_max.toLocaleString('es-AR')}`
                  : ''}
              </Text>

              {search.description ? (
                <Text style={styles.searchDescription}>
                  {search.description}
                </Text>
              ) : null}

              {matches.length > 0 ? (
                <View style={styles.matchesBlock}>
                  <Text style={styles.matchesTitle}>
                    Coincidencias con tu stock: {matches.length}
                  </Text>
                  {top.map((m) => {
                    const v = m.vehicle;
                    const title =
                      v.title ||
                      `${v.brand || ''} ${v.model || ''}`.trim() ||
                      v.id;
                    const year = v.year ? ` (${v.year})` : '';
                    const price =
                      typeof v.price === 'number'
                        ? ` – $${v.price.toLocaleString('es-AR')}`
                        : '';
                    return (
                      <Text key={v.id} style={styles.matchRow}>
                        • {title}
                        {year}
                        {price} ({m.score}/100)
                      </Text>
                    );
                  })}
                  {matches.length > top.length ? (
                    <Text style={styles.matchRow}>
                      …y {matches.length - top.length} más
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text style={styles.noMatches}>
                  No hay coincidencias con el stock actual.
                </Text>
              )}
            </View>
          );
        })}
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
  errorSmall: {
    color: '#f97373',
    fontSize: 12,
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  headerButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  headerButton: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1f2937',
    marginLeft: 4,
  },
  headerButtonDanger: {
    backgroundColor: '#b91c1c',
  },
  headerButtonWhatsapp: {
    backgroundColor: '#16a34a',
  },

  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
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
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '600',
    fontSize: 13,
  },

  searchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emptyText: {
    marginTop: 8,
    color: '#9ca3af',
    fontSize: 12,
  },

  searchCard: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 10,
    padding: 10,
  },
  searchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  searchTitle: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  searchActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIconButton: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    marginLeft: 4,
  },
  searchDeleteButton: {
    backgroundColor: '#451a1a',
  },
  searchMeta: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 4,
  },
  searchDescription: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 4,
  },

  matchesBlock: {
    marginTop: 6,
  },
  matchesTitle: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  matchRow: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  noMatches: {
    marginTop: 6,
    color: '#9ca3af',
    fontSize: 12,
  },
});
