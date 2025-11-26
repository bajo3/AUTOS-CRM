// components/meli/MeliItemRow.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MeliItem } from '../../../src/lib/meliApi';

type Props = {
  item: MeliItem;
  onChangePrice?: (id: string) => void;
  onClose?: (id: string) => void;
};

export default function MeliItemRow({ item, onChangePrice, onClose }: Props) {
  const dateLabel = item.date_created
    ? new Date(item.date_created).toLocaleDateString('es-AR')
    : '-';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Text style={styles.thumbText}>ML</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.id}>{item.id}</Text>
          <Text style={styles.date}>Creado: {dateLabel}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Precio</Text>
          <Text style={styles.priceValue}>
            ${item.price.toLocaleString('es-AR')}
          </Text>
        </View>

        <View style={styles.actions}>
          {onChangePrice && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => onChangePrice(item.id)}
            >
              <Text style={styles.buttonTextSecondary}>Cambiar precio</Text>
            </TouchableOpacity>
          )}

          {onClose && (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={() => onClose(item.id)}
            >
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbText: {
    color: '#9ca3af',
    fontWeight: '700',
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  id: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  date: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceBlock: {},
  priceLabel: {
    color: '#9ca3af',
    fontSize: 11,
  },
  priceValue: {
    color: '#60a5fa',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonSecondary: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  buttonText: {
    color: '#f9fafb',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
  },
});
