// app/index.tsx

import { Redirect } from 'expo-router';

export default function Index() {
  // Cuando abre la app, redirige directo a la pestaña CRM
  return <Redirect href="/(tabs)/crm" />;
}
