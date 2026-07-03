import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/api';

export default function SimulatorScreen() {
  const [initialAmount, setInitialAmount] = useState('10000');
  const [monthlyInvestment, setMonthlyInvestment] = useState('500');
  const [months, setMonths] = useState('12');
  const [annualReturn, setAnnualReturn] = useState('0.08');
  const [volatility, setVolatility] = useState('0.15');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/simulator/dca`,
        {
          initialAmount: parseFloat(initialAmount),
          monthlyInvestment: parseFloat(monthlyInvestment),
          months: parseInt(months),
          annualReturn: parseFloat(annualReturn),
          volatility: parseFloat(volatility),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setResult(response.data.data);
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>DCA Simulator</Text>
        <Text style={styles.subtitle}>Dollar-Cost Averaging Calculator</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Initial Amount ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="10000"
          value={initialAmount}
          onChangeText={setInitialAmount}
          keyboardType="decimal-pad"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Monthly Investment ($)</Text>
        <TextInput
          style={styles.input}
          placeholder="500"
          value={monthlyInvestment}
          onChangeText={setMonthlyInvestment}
          keyboardType="decimal-pad"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Months</Text>
        <TextInput
          style={styles.input}
          placeholder="12"
          value={months}
          onChangeText={setMonths}
          keyboardType="number-pad"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Annual Return (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="8"
          value={annualReturn}
          onChangeText={setAnnualReturn}
          keyboardType="decimal-pad"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Volatility (%)</Text>
        <TextInput
          style={styles.input}
          placeholder="15"
          value={volatility}
          onChangeText={setVolatility}
          keyboardType="decimal-pad"
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSimulate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Run Simulation</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Simulation Results</Text>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Initial Investment</Text>
            <Text style={styles.resultValue}>${parseFloat(initialAmount).toFixed(2)}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Invested</Text>
            <Text style={styles.resultValue}>${result.totalInvested?.toFixed(2)}</Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Final Balance</Text>
            <Text style={[styles.resultValue, { color: '#4ade80' }]}>
              ${result.finalBalance?.toFixed(2)}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Total Gains</Text>
            <Text style={[styles.resultValue, { color: '#60a5fa' }]}>
              ${result.totalGains?.toFixed(2)}
            </Text>
          </View>

          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>ROI</Text>
            <Text style={[styles.resultValue, { color: '#fbbf24' }]}>
              {result.roi?.toFixed(2)}%
            </Text>
          </View>

          {result.monthlyData?.length > 0 && (() => {
            const maxBalance = Math.max(...result.monthlyData.map((m: any) => m.balance));
            return (
              <View style={styles.chartWrapper}>
                <Text style={styles.chartTitle}>Évolution mensuelle</Text>
                <View style={styles.chartBars}>
                  {result.monthlyData.map((d: any, i: number) => (
                    <View key={i} style={styles.barCol}>
                      <View style={[
                        styles.bar,
                        {
                          height: Math.max((d.balance / maxBalance) * 60, 4),
                          backgroundColor: d.gainLoss >= 0 ? '#10b981' : '#ef4444',
                        },
                      ]} />
                    </View>
                  ))}
                </View>
                <View style={styles.chartFooter}>
                  <Text style={styles.chartFooterText}>Mois 1</Text>
                  <Text style={styles.chartFooterText}>Mois {result.months}</Text>
                </View>
              </View>
            );
          })()}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  formContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  resultContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  resultLabel: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  resultValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  chartWrapper: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 10,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 70,
    gap: 2,
  },
  barCol: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    borderRadius: 2,
  },
  chartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  chartFooterText: {
    fontSize: 10,
    color: '#64748b',
  },
});
