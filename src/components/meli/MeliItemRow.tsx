// src/components/meli/MeliItemRow.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { MeliItem } from '../../lib/meliApi';

type Props = {
  item: MeliItem;
  onChangePrice?: (id: string) => void;
  onClose?: (id: string) => void;
  onRelist?: (id: string) => void;
  onLinkVehicle?: (id: string) => void;
};

export default function MeliItemRow({
  item,
  onChangePrice,
  onClose,
  onRelist,
  onLinkVehicle,
}: Props) {
  // -------- FECHA --------
  const rawDate =
    item.start_time || (item as any).date_created || (item as any).stop_time;
  let dateLabel = '-';
  if (rawDate) {
    const ts = new Date(rawDate);
    if (!isNaN(ts.getTime())) {
      dateLabel = ts.toLocaleDateString('es-AR');
    }
  }

  // -------- PRECIO --------
  const rawPrice: any = (item as any).price;
  let priceLabel = '-';

  if (typeof rawPrice === 'number') {
    priceLabel = rawPrice.toLocaleString('es-AR');
  } else if (typeof rawPrice === 'string' && rawPrice.trim() !== '') {
    const n = Number(rawPrice);
    if (!isNaN(n)) {
      priceLabel = n.toLocaleString('es-AR');
    }
  } else {
    console.warn('[MeliItemRow] Item sin price', {
      id: item.id,
      price: rawPrice,
      title: item.title,
    });
  }

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
          <Text style={styles.date}>Publicada: {dateLabel}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceLabel}>Precio</Text>
          <Text style={styles.priceValue}>${priceLabel}</Text>
        </View>

        <View style={styles.actions}>
          {onChangePrice && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => onChangePrice(item.id)}
            >
              <Text style={styles.buttonTextSecondary}>Precio</Text>
            </TouchableOpacity>
          )}

          {onRelist && (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => onRelist(item.id)}
            >
              <Text style={styles.buttonText}>Republicar</Text>
            </TouchableOpacity>
          )}

          {onLinkVehicle && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => onLinkVehicle(item.id)}
            >
              <Text style={styles.buttonTextSecondary}>Vincular auto</Text>
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
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: 6, // reemplaza "gap"
    marginTop: 4,
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonSecondary: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
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
