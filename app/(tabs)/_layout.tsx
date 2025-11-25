// app/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="crm"
        options={{
          title: 'CRM',
        }}
      />
      <Tabs.Screen
        name="meli"
        options={{
          title: 'MercadoLibre',
        }}
      />
    </Tabs>
  );
}
