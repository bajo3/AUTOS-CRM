// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme, ColorSchemeName } from 'react-native';

function getTabBarOptions(colorScheme: ColorSchemeName) {
  const dark = colorScheme === 'dark';
  return {
    headerShown: false,
    tabBarActiveTintColor: '#3b82f6',
    tabBarInactiveTintColor: '#9ca3af',
    tabBarStyle: {
      backgroundColor: dark ? '#020617' : '#ffffff',
      borderTopColor: dark ? '#111827' : '#e5e7eb',
    },
    tabBarLabelStyle: {
      fontSize: 11,
    },
  } as const;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={getTabBarOptions(colorScheme)}>
      {/* CRM completo (clientes, búsquedas, vehículos) */}
      <Tabs.Screen
        name="crm"
        options={{
          title: 'CRM',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people-alt" size={size} color={color} />
          ),
        }}
      />

      {/* MercadoLibre (el nombre correcto del route es "meli", no "meli/index") */}
      <Tabs.Screen
        name="meli"
        options={{
          title: 'MercadoLibre',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="storefront" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
