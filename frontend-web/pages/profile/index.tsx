import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AppLayout from '../../components/layout/AppLayout';
import { authApi } from '../../api';

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const TABS = ['Général', 'Abonnement', 'Sécurité'];

const ProfilePage: NextPage = () => {
  const [activeTab, setActiveTab] = useState('Général');
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<{ id: string; email: string; username: string; createdAt: string } | null>(null);

  // Form state (pre-filled from profile once loaded)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  useEffect(() => {
    authApi.getProfile()
      .then(({ data }) => {
        setProfile(data);
        setFormName(data.username);
        setFormEmail(data.email);
      })
      .catch(() => {
        // Keep defaults if backend unavailable
        setFormName('John Doe');
        setFormEmail('john.doe@example.com');
      });
  }, []);

  const initials = formName
    ? formName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'JD';

  const subscription = 'Premium';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb',
    borderRadius: '10px', fontSize: '14px', color: '#111827',
    background: editing ? 'white' : '#f9fafb', outline: 'none', boxSizing: 'border-box',
    cursor: editing ? 'text' : 'default',
  };

  return (
    <AppLayout title="Mon Profil" subtitle="Gérez vos informations personnelles et vos préférences">
      <Head><title>Mon Profil — TradingAI</title></Head>

      {/* Profile card */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#2563eb', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 700,
            }}>{initials}</div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>{formName || 'John Doe'}</h2>
              <span style={{ background: '#2563eb', color: 'white', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                👑 {subscription}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>{formEmail || 'john.doe@example.com'}</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
              <span>🌐 Français</span>
              <span>🕐 Europe/Paris (GMT+1)</span>
              {profile?.createdAt && <span>📅 Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>}
            </div>
          </div>

          <button style={{
            padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb',
            background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            ✏️ Modifier la photo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: '12px', padding: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)', width: 'fit-content' }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: activeTab === tab ? 700 : 500,
            background: activeTab === tab ? '#2563eb' : 'transparent',
            color: activeTab === tab ? 'white' : '#6b7280',
            transition: 'all 0.15s',
          }}>{tab}</button>
        ))}
      </div>

      {activeTab === 'Général' && (
        <>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Informations Personnelles</h3>
              <button onClick={() => setEditing(!editing)} style={{
                padding: '7px 16px', borderRadius: '10px', border: '1px solid #e5e7eb',
                background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ✏️ {editing ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Nom d'utilisateur</label>
                <input value={formName} readOnly={!editing} onChange={(e) => setFormName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Email</label>
                <input value={formEmail} readOnly={!editing} onChange={(e) => setFormEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Langue</label>
                <select disabled={!editing} style={inputStyle}>
                  <option>Français</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>Fuseau horaire</label>
                <select disabled={!editing} style={inputStyle}>
                  <option>Paris (GMT+1)</option>
                  <option>London (GMT+0)</option>
                  <option>New York (GMT-5)</option>
                </select>
              </div>
            </div>
            {editing && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(false)} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                  Annuler
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '9px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'white' }}>
                  Sauvegarder
                </button>
              </div>
            )}
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Préférences de Notifications</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Gérez vos préférences de communication</p>
              </div>
              <button style={{
                padding: '8px 16px', borderRadius: '10px', border: '1px solid #e5e7eb',
                background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                🔔 Configurer les notifications
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px' }}>
              {[
                { label: 'Nouveaux signaux de trading', sub: 'Recevoir une notification à chaque nouveau signal', on: true },
                { label: 'Résumé quotidien', sub: 'Récapitulatif de vos performances chaque soir', on: true },
                { label: 'Alertes de marché', sub: 'Mouvements importants sur les cryptos suivies', on: false },
                { label: 'Mises à jour du système', sub: 'Nouveautés et améliorations de la plateforme', on: true },
              ].map((notif, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: '#f9fafb', borderRadius: '10px' }}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{notif.label}</p>
                    <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>{notif.sub}</p>
                  </div>
                  <div style={{
                    width: '44px', height: '24px', borderRadius: '99px',
                    background: notif.on ? '#2563eb' : '#d1d5db',
                    position: 'relative', cursor: 'pointer', flexShrink: 0,
                  }}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                      position: 'absolute', top: '3px',
                      left: notif.on ? '23px' : '3px',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'Abonnement' && (
        <div style={card}>
          <div style={{ textAlign: 'center', padding: '40px 24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
              👑
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>Plan {subscription}</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 24px' }}>
              {profile ? `Compte créé le ${new Date(profile.createdAt).toLocaleDateString('fr-FR')}` : 'Actif jusqu\'au 31 mars 2025'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
              {['Signaux illimités', 'Simulateur avancé', 'Formation complète', 'Alertes en temps réel', 'Support prioritaire', 'Analyse IA avancée'].map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '10px' }}>
                  <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#065f46' }}>{f}</span>
                </div>
              ))}
            </div>
            <button style={{ padding: '10px 28px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
              Gérer mon abonnement
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Sécurité' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={card}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 20px' }}>Changer le mot de passe</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le nouveau mot de passe'].map((l, i) => (
                <div key={i}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>{l}</label>
                  <input type="password" style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }} />
                </div>
              ))}
            </div>
            <button style={{ marginTop: '16px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
              Mettre à jour
            </button>
          </div>

          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Authentification à deux facteurs</h3>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>Renforcez la sécurité de votre compte</p>
              </div>
              <button style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                Activer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ProfilePage;
