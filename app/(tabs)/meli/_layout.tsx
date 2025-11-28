import React from 'react';
import { Stack } from 'expo-router';

export default function MeliLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
