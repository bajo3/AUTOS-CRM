// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ColorSchemeName, useColorScheme } from 'react-native';

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
  } as const;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={getTabBarOptions(colorScheme)}>
      {/* Autos (CRM) */}
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Autos',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="directions-car-filled" size={size} color={color} />
          ),
        }}
      />

      {/* MercadoLibre */}
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
