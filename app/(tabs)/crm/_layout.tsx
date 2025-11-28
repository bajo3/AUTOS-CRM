// app/(tabs)/crm/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function CrmLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
