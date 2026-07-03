import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Default export required — RootNavigator: import SignalDetailScreen from '...'
export default function SignalDetailScreen({ route }: any) {
  const signalId: string | undefined = route?.params?.signalId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signal Detail</Text>
      <Text style={styles.id}>ID : {signalId ?? 'N/A'}</Text>
      <Text style={styles.subtitle}>À implémenter</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  id: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
  },
});
