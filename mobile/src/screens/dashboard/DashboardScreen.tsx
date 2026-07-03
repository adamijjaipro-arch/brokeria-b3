import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

interface Signal {
  id: string;
  asset: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry_price: number;
  stop_loss: number;
  take_profit: number;
  createdAt: string;
}

export default function DashboardScreen() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [signalsRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/signals/recent`, { headers }),
        axios.get(`${API_URL}/signals/statistics`, { headers }),
      ]);
      setSignals(signalsRes.data.data);
      setStats(statsRes.data.data);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Signals</Text>
          <Text style={styles.statValue}>{stats?.totalSignals || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Buy</Text>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{stats?.buySignals || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sell</Text>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{stats?.sellSignals || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Confidence</Text>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>
            {stats?.averageConfidence?.toFixed(0) || 0}%
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Signals</Text>
      <FlatList
        data={signals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.signalCard}>
            <View style={styles.signalHeader}>
              <Text style={styles.asset}>{item.asset}</Text>
              <View style={[styles.badge, item.direction === 'BUY' ? styles.buyBadge : styles.sellBadge]}>
                <Text style={styles.badgeText}>{item.direction}</Text>
              </View>
            </View>
            <View style={styles.signalDetails}>
              <View>
                <Text style={styles.detailLabel}>Entry</Text>
                <Text style={styles.detailValue}>${item.entry_price.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>SL</Text>
                <Text style={styles.detailValue}>${item.stop_loss.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>TP</Text>
                <Text style={styles.detailValue}>${item.take_profit.toFixed(2)}</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Confidence</Text>
                <Text style={[styles.detailValue, { color: '#3b82f6' }]}>{item.confidence.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: '#334155',
    borderWidth: 1,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 8,
  },
  statValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  signalCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  asset: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buyBadge: {
    backgroundColor: '#10b981',
  },
  sellBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  signalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 4,
  },
  detailValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
