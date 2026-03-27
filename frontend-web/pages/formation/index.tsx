import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../components/layout/AppLayout';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const MODULES = [
  { title: 'Introduction aux Chandeliers Japonais', level: 1, done: true, duration: '25 min' },
  { title: 'Support et Résistance', level: 1, done: true, duration: '30 min' },
  { title: 'Gestion du Risque', level: 2, done: false, duration: '40 min' },
  { title: 'Psychologie du Trading', level: 2, done: false, duration: '35 min' },
];

const ACHIEVEMENTS = [
  { icon: '🏆', title: 'Premier Pas', desc: 'Complétez votre premier module', unlocked: true },
  { icon: '🏆', title: 'Niveau 1 Maîtrisé', desc: 'Terminez tous les modules du niveau 1', unlocked: true },
  { icon: '🔒', title: 'Série de 7', desc: 'Apprenez 7 jours consécutifs', unlocked: false },
  { icon: '🔒', title: 'Expert', desc: 'Complétez les 3 niveaux', unlocked: false },
];

const FormationPage: NextPage = () => {
  const [activeTab] = useState('parcours');

  const btnOutline: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb',
    background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
  };
  const btnPrimary: React.CSSProperties = {
    padding: '8px 16px', borderRadius: '10px', border: 'none',
    background: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'white',
  };

  return (
    <AppLayout title="Formation Trading" subtitle="Apprenez à trader comme un professionnel">
      <Head><title>Formation — TradingAI</title></Head>

      {/* Header badges */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', marginTop: '-8px' }}>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            🏆 Niveau : Expert
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600 }}>
            ⭐ Points : 2 450
          </span>
        </div>
      </div>

      {/* Global Progression */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Progression Globale</span>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb' }}>48%</span>
        </div>
        <div style={{ height: '10px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ width: '48%', height: '100%', background: '#2563eb', borderRadius: '99px' }} />
        </div>
        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>22 modules complétés sur 45</p>
      </div>

      {/* Learning paths */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Level 1 — completed */}
        <div style={{ ...card, background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ background: '#2563eb', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Niveau 1</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>Fondamentaux</span>
                <span style={{ fontSize: '13px' }}>✅</span>
              </div>
              <p style={{ fontSize: '13px', color: '#3b82f6', margin: '0 0 12px' }}>Apprenez les bases du trading et de l'analyse technique</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                <span>📚 12 modules</span>
                <span>⏱ 4h 30min</span>
              </div>
              <div style={{ height: '8px', background: '#bfdbfe', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: '100%', height: '100%', background: '#2563eb', borderRadius: '99px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#3b82f6', margin: 0 }}>100% complété</p>
            </div>
            <button style={btnOutline}>✓ Revoir</button>
          </div>
        </div>

        {/* Level 2 — in progress */}
        <div style={{ ...card, background: '#faf5ff', border: '1px solid #e9d5ff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ background: '#7c3aed', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Niveau 2</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#5b21b6' }}>Intermédiaire</span>
                <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>En cours</span>
              </div>
              <p style={{ fontSize: '13px', color: '#7c3aed', margin: '0 0 12px' }}>Maîtrisez les stratégies avancées et l'analyse fondamentale</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                <span>📚 15 modules</span>
                <span>⏱ 6h 15min</span>
              </div>
              <div style={{ height: '8px', background: '#e9d5ff', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ width: '35%', height: '100%', background: '#7c3aed', borderRadius: '99px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#7c3aed', margin: 0 }}>35% complété</p>
            </div>
            <button style={{ ...btnPrimary, background: '#7c3aed' }}>Continuer</button>
          </div>
        </div>

        {/* Level 3 — locked */}
        <div style={{ ...card, opacity: 0.6 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ background: '#6b7280', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>Niveau 3</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>Avancé</span>
                <span>🔒</span>
              </div>
              <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 12px' }}>Maîtrisez les techniques des traders professionnels</p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#9ca3af' }}>
                <span>📚 18 modules</span>
                <span>⏱ 8h 00min</span>
              </div>
            </div>
            <button style={{ ...btnOutline, opacity: 0.5, cursor: 'not-allowed' }}>🔒 Verrouillé</button>
          </div>
        </div>
      </div>

      {/* Featured Modules */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Modules en Vedette</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {MODULES.map((m, i) => (
            <div key={i} style={card}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                      background: m.level === 1 ? '#eff6ff' : '#faf5ff',
                      color: m.level === 1 ? '#2563eb' : '#7c3aed',
                    }}>Niveau {m.level}</span>
                    {m.done ? <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>✅ Complété</span>
                      : <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                    }
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px', lineHeight: '1.4' }}>{m.title}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>⏱ {m.duration}</p>
                </div>
                <button style={m.done ? btnOutline : btnPrimary}>
                  {m.done ? 'Revoir' : 'Commencer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Succès</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} style={{
              ...card,
              background: a.unlocked ? '#f0fdf4' : 'white',
              border: a.unlocked ? '1px solid #bbf7d0' : '1px solid #f3f4f6',
              opacity: a.unlocked ? 1 : 0.6,
            }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '28px' }}>{a.icon}</span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: a.unlocked ? '#065f46' : '#374151', margin: '0 0 4px' }}>{a.title}</p>
                  <p style={{ fontSize: '12px', color: a.unlocked ? '#10b981' : '#9ca3af', margin: 0 }}>{a.desc}</p>
                  {a.unlocked && (
                    <span style={{ display: 'inline-block', marginTop: '6px', background: '#d1fae5', color: '#065f46', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px' }}>Débloqué</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Banner */}
      <div style={{ background: '#2563eb', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
          Prêt à passer au niveau supérieur ?
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', margin: '0 0 20px' }}>
          Débloquez tous les modules avec Premium et accédez à du contenu exclusif
        </p>
        <button style={{
          background: '#111827', color: 'white', border: 'none', padding: '12px 28px',
          borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '8px',
        }}>
          🎓 Passer à Premium
        </button>
      </div>
    </AppLayout>
  );
};

export default FormationPage;
