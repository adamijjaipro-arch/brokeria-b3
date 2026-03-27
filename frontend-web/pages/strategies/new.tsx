import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
  borderRadius: '10px', fontSize: '14px', color: '#111827',
  background: 'white', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

const PLACEHOLDER_CODE = `# Exemple de stratégie Python
def strategy(data):
    # Calcul des indicateurs
    ema20 = data['close'].ewm(span=20).mean()
    ema50 = data['close'].ewm(span=50).mean()
    rsi = compute_rsi(data['close'], 14)

    # Signal d'entrée
    buy_signal = (ema20 > ema50) and (rsi < 70)

    # Gestion du risque
    stop_loss = data['close'] * 0.98   # -2%
    take_profit = data['close'] * 1.04  # +4%

    return {
        'signal': 'BUY' if buy_signal else 'HOLD',
        'stop_loss': stop_loss,
        'take_profit': take_profit,
    }`;

const NewStrategyPage: NextPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', asset: 'BTC/USDT', timeframe: '4H', code: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.code) return;
    setSubmitted(true);
    setTimeout(() => router.push('/strategies'), 1500);
  };

  return (
    <AppLayout>
      <Head><title>Nouvelle Stratégie — TradingAI</title></Head>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/strategies')} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Mes stratégies
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Importer une stratégie</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '2px 0 0' }}>Ajoutez votre code de stratégie pour l'analyser avec l'IA</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Main form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Informations générales</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Nom de la stratégie <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  placeholder="Ex: BTC Trend Following EMA 20/50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez votre stratégie : indicateurs utilisés, logique d'entrée/sortie..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Actif principal</label>
                  <select value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} style={inputStyle}>
                    {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT', 'Multi'].map((a) => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Timeframe</label>
                  <select value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })} style={inputStyle}>
                    {['5M', '15M', '1H', '4H', '1D'].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Code editor */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Code de la stratégie <span style={{ color: '#ef4444' }}>*</span></h2>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>Python ou JavaScript — incluez la logique d'entrée, stop loss et take profit</p>
              </div>
              <button onClick={() => setForm({ ...form, code: PLACEHOLDER_CODE })} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#6b7280' }}>
                Charger exemple
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px', zIndex: 1 }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f97316' }} />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
              </div>
              <textarea
                rows={16}
                placeholder={PLACEHOLDER_CODE}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                style={{
                  ...inputStyle,
                  background: '#0d1117',
                  color: '#e5e7eb',
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontSize: '13px',
                  lineHeight: '1.6',
                  paddingTop: '36px',
                  resize: 'vertical',
                  border: '1px solid #374151',
                }}
              />
            </div>
          </div>

          {/* Submit */}
          {submitted ? (
            <div style={{ ...card, background: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center', padding: '20px' }}>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#065f46', margin: '0 0 4px' }}>✅ Stratégie importée avec succès !</p>
              <p style={{ fontSize: '13px', color: '#10b981', margin: 0 }}>Redirection vers vos stratégies...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => router.push('/strategies')} style={{ padding: '12px 20px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Annuler
              </button>
              <button onClick={handleSubmit} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: !form.name || !form.code ? '#93c5fd' : '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: !form.name || !form.code ? 'not-allowed' : 'pointer' }}>
                🚀 Importer et analyser
              </button>
            </div>
          )}
        </div>

        {/* Tips sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={card}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💡 Conseils
            </h3>
            {[
              { icon: '🎯', title: 'Signal clair', desc: 'Définissez des conditions d\'entrée précises avec plusieurs confirmations.' },
              { icon: '🛡️', title: 'Stop Loss', desc: 'Incluez toujours un stop loss. Maximum 2-3% de risque par trade.' },
              { icon: '📈', title: 'Take Profit', desc: 'Visez un ratio risque/rendement d\'au moins 1:2.' },
              { icon: '🔄', title: 'Backtest', desc: 'Après import, testez votre stratégie dans le simulateur.' },
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: i < 3 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{tip.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '0 0 2px' }}>{tip.title}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, lineHeight: '1.4' }}>{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af', margin: '0 0 8px' }}>📚 Langages supportés</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Python', 'JavaScript', 'Pine Script'].map((l) => (
                <span key={l} style={{ background: 'white', border: '1px solid #bfdbfe', color: '#2563eb', fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default NewStrategyPage;
