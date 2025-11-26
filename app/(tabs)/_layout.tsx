// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#1f2937',
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="crm/index"
        options={{
          title: 'CRM',
        }}
      />
      <Tabs.Screen
        name="meli/index"
        options={{
          title: 'MercadoLibre',
        }}
      />
    </Tabs>
  );
}
