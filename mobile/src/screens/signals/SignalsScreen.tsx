import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

export default function SignalsScreen({ navigation }) {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchSignals();
    });
    return unsubscribe;
  }, [navigation]);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/signals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSignals(response.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(s =>
    filter === 'all' ? true : s.direction === filter
  );

  const renderSignal = ({ item }) => (
    <TouchableOpacity
      style={styles.signalCard}
      onPress={() =>
        navigation.navigate('SignalDetail', { signalId: item.id })
      }
    >
      <View style={styles.signalHeader}>
        <Text style={styles.assetName}>{item.asset}</Text>
        <View
          style={[
            styles.directionBadge,
            {
              backgroundColor:
                item.direction === 'BUY'
                  ? '#10b981'
                  : item.direction === 'SELL'
                  ? '#ef4444'
                  : '#eab308',
            },
          ]}
        >
          <Text style={styles.directionText}>{item.direction}</Text>
        </View>
      </View>

      <View style={styles.signalDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Entry:</Text>
          <Text style={styles.detailValue}>${item.entry_price}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>SL:</Text>
          <Text style={[styles.detailValue, { color: '#ef4444' }]}>
            ${item.stop_loss}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>TP:</Text>
          <Text style={[styles.detailValue, { color: '#10b981' }]}>
            ${item.take_profit}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Confidence:</Text>
          <Text style={[styles.detailValue, { color: '#3b82f6' }]}>
            {item.confidence}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSignals}>
          <Text style={styles.retryText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {['all', 'BUY', 'SELL', 'HOLD'].map(filterOption => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterButton,
              filter === filterOption && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterText,
                filter === filterOption && styles.filterTextActive,
              ]}
            >
              {filterOption === 'all' ? 'All' : filterOption}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredSignals.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No signals available</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSignals}
          renderItem={renderSignal}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 12,
  },
  signalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  signalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  directionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  directionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  signalDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 16,
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
});
