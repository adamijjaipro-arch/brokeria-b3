import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';

/* ═══════════════════════════════
   BROKER IA — Landing Page Pro
   ═══════════════════════════════ */

const TICKER = [
  { symbol: 'BTC/USDT', price: '$67 234', change: '+2.34%', up: true },
  { symbol: 'ETH/USDT', price: '$3 567', change: '-1.23%', up: false },
  { symbol: 'SOL/USDT', price: '$134.2', change: '+5.67%', up: true },
  { symbol: 'BNB/USDT', price: '$412.3', change: '+1.89%', up: true },
  { symbol: 'XRP/USDT', price: '$0.632', change: '+3.12%', up: true },
  { symbol: 'ADA/USDT', price: '$0.58', change: '-0.87%', up: false },
  { symbol: 'MATIC',    price: '$0.91', change: '+4.20%', up: true },
  { symbol: 'DOGE',     price: '$0.14', change: '+6.44%', up: true },
];

const FEATURES = [
  { icon: '🤖', title: 'Analyse IA Temps Réel', desc: 'Deep learning entraîné sur 10 ans de données. Détecte les opportunités avant les autres traders.', tag: 'Intelligence Artificielle' },
  { icon: '📊', title: '15+ Patterns Chartistes', desc: 'Head & Shoulders, Double Top/Bottom, Triangles, Wedges, Elliott Waves. Détection automatique et précise.', tag: 'Pattern Recognition' },
  { icon: '⚡', title: 'Signaux en < 200ms', desc: 'Recevez BUY/SELL/HOLD avec score de confiance, entrée, stop-loss et take-profit calculés par l\'IA.', tag: 'Ultra-Rapide' },
  { icon: '🎯', title: 'Simulateur DCA', desc: 'Simulez vos stratégies long terme. Analysez ROI, drawdown, Sharpe ratio sur données historiques réelles.', tag: 'Backtest' },
  { icon: '🛡️', title: 'Gestion du Risque', desc: 'Calcul automatique de la taille de position, ratio risk/reward, et alertes de risque portefeuille.', tag: 'Risk Management' },
  { icon: '📱', title: 'Alertes Multi-Canal', desc: 'Telegram, email, push mobile. Ne ratez jamais une opportunité de marché, 24h/24.', tag: 'Notifications' },
];

const TESTIMONIALS = [
  { name: 'Marc Lefebvre', role: 'Trader Indépendant · Paris', text: 'Depuis que j\'utilise TradingAI, mon win rate est passé de 51% à 74%. Les signaux sont précis et les patterns sont expliqués clairement. Un outil indispensable.', avatar: 'ML', stars: 5 },
  { name: 'Sarah Benali', role: 'Gestionnaire de Fonds · Lyon', text: 'L\'analyse IA est bluffante. En 3 mois d\'utilisation Pro, j\'ai optimisé mes entrées et réduit mon drawdown maximum de 28%. Le simulateur DCA est excellent.', avatar: 'SB', stars: 5 },
  { name: 'Thomas Vidal', role: 'Crypto Trader · Bordeaux', text: 'Interface ultra-professionnelle, signaux fiables et support réactif. J\'ai récupéré mon abonnement dès la première semaine. Je recommande à 100%.', avatar: 'TV', stars: 5 },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    desc: 'Pour découvrir la plateforme',
    features: ['3 signaux / jour', '1 pattern détecté', 'Dashboard basique', 'Accès communauté'],
    cta: 'Commencer gratuitement',
    popular: false,
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mois',
    desc: 'Pour les traders sérieux',
    features: ['Signaux illimités', '15+ patterns auto', 'Simulateur DCA complet', 'Alertes Telegram', 'Rapports IA', 'Support prioritaire'],
    cta: 'Essai gratuit 14 jours',
    popular: true,
    highlight: true,
  },
  {
    name: 'Elite',
    price: '79€',
    period: '/mois',
    desc: 'Pour les professionnels',
    features: ['Tout le plan Pro', 'API Access', 'Stratégies custom', 'Account manager', 'Webinaires exclusifs', 'Accès bêta anticipé'],
    cta: 'Contacter l\'équipe',
    popular: false,
    highlight: false,
  },
];

const FAQS = [
  { q: 'Comment fonctionne l\'IA ?', a: 'Nos modèles de deep learning analysent en continu les prix, volumes, order book, sentiment social et indicateurs macro. Entraînés sur 10+ ans de données, ils génèrent des signaux avec score de confiance.' },
  { q: 'Quelle est la précision des signaux ?', a: 'Sur les 12 derniers mois, notre win rate moyen est de 73.5% sur les signaux avec une confiance > 80%. Les performances passées ne garantissent pas les résultats futurs.' },
  { q: 'Quels marchés sont couverts ?', a: 'BTC, ETH, SOL, BNB, XRP et 50+ cryptomonnaies. Nous ajoutons régulièrement de nouveaux actifs en fonction des demandes de la communauté.' },
  { q: 'Puis-je annuler à tout moment ?', a: 'Oui, sans engagement. Votre accès reste actif jusqu\'à la fin de la période de facturation. Aucuns frais cachés.' },
  { q: 'L\'essai gratuit nécessite-t-il une carte ?', a: 'Non. L\'essai Pro 14 jours est entièrement gratuit, sans carte bancaire. Vous upgradez seulement si vous êtes satisfait.' },
];

const Home: NextPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <Layout>
      <Head>
        <title>TradingAI — Signaux Crypto IA Précis à 95%</title>
        <meta name="description" content="Plateforme de trading IA : signaux BUY/SELL en temps réel, 15+ patterns, simulateur DCA. Rejoignez 2400+ traders." />
      </Head>

      {/* ══════════════════════════════════════
          HERO — Dark premium
      ══════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #060b14 0%, #0a1628 40%, #0d1f3c 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        position: 'relative', overflow: 'hidden', paddingTop: '80px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '900px', height: '400px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '900px', padding: '0 24px' }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Système actif · Analyse 24/7 en cours</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 800, color: 'white', lineHeight: 1.05, margin: '0 0 24px', letterSpacing: '-2px' }}>
            Tradez avec<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              l'Intelligence Artificielle
            </span>
          </h1>

          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 40px' }}>
            Notre IA analyse les marchés crypto 24/7, détecte 15+ patterns chartistes et génère des signaux BUY/SELL avec une précision de <strong style={{ color: '#60a5fa' }}>95%</strong>.
          </p>

          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '15px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', fontSize: '16px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 40px rgba(37,99,235,0.4)', transition: 'all 0.2s',
            }}>
              Commencer gratuitement
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '15px 32px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0', fontSize: '16px', fontWeight: 600, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)',
              transition: 'all 0.2s',
            }}>
              Se connecter
            </Link>
          </div>

          <p style={{ fontSize: '13px', color: '#475569', marginBottom: '64px' }}>
            Aucune carte bancaire · Essai gratuit 14 jours · Annulation à tout moment
          </p>

          {/* Signal preview card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '20px 24px', maxWidth: '640px', margin: '0 auto',
            boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Signal IA en direct</span>
              </div>
              <span style={{ fontSize: '12px', color: '#475569' }}>il y a 2 min</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center' }}>
              <div style={{ background: 'rgba(16,185,129,0.15)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <p style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>BUY</p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'white', margin: 0 }}>BTC/USDT</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {[
                  { label: 'ENTRÉE', val: '$67 234', col: '#e2e8f0' },
                  { label: 'OBJECTIF', val: '$69 500', col: '#10b981' },
                  { label: 'STOP', val: '$66 000', col: '#ef4444' },
                ].map((item) => (
                  <div key={item.label}>
                    <p style={{ fontSize: '10px', color: '#475569', fontWeight: 600, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: item.col, margin: 0 }}>{item.val}</p>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '11px', color: '#475569', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>CONFIANCE</p>
                <p style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', margin: 0, lineHeight: 1 }}>92%</p>
                <div style={{ width: '60px', height: '5px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ width: '92%', height: '100%', background: 'linear-gradient(90deg, #059669, #10b981)', borderRadius: '99px' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#60a5fa' }}>📊</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Pattern : <strong style={{ color: '#cbd5e1' }}>Bullish Engulfing</strong> + <strong style={{ color: '#cbd5e1' }}>RSI Oversold</strong> · Timeframe 4H</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TICKER — Live prix
      ══════════════════════════════════════ */}
      <div style={{ background: '#060b14', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 0', overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ display: 'flex', gap: '48px', width: 'max-content', animation: 'ticker 25s linear infinite' }}>
          {[...TICKER, ...TICKER].map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{t.symbol}</span>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>{t.price}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.up ? '#10b981' : '#ef4444', background: t.up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: '6px' }}>{t.change}</span>
              <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '16px' }}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          STATS — Chiffres clés
      ══════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '80px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#f1f5f9', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {[
              { val: '95.2%', label: 'Précision IA', sub: 'sur signaux > 80% confiance', icon: '🎯' },
              { val: '2 400+', label: 'Traders actifs', sub: 'sur la plateforme', icon: '👥' },
              { val: '15+', label: 'Patterns détectés', sub: 'automatiquement', icon: '📊' },
              { val: '< 200ms', label: 'Temps de réponse', sub: 'pour chaque signal', icon: '⚡' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', padding: '36px 32px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
                <p style={{ fontSize: '40px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-1px' }}>{s.val}</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>{s.label}</p>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES — 6 cartes
      ══════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '100px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Fonctionnalités</span>
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>
              Tout pour trader <span style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>intelligemment</span>
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '560px', margin: '0 auto', lineHeight: 1.6 }}>Des outils IA puissants conçus pour vous donner un avantage décisif sur les marchés.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: 'white', borderRadius: '20px', padding: '32px',
                border: '1px solid #e2e8f0', transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div style={{ fontSize: '40px', lineHeight: 1 }}>{f.icon}</div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: '99px', border: '1px solid #e2e8f0' }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 10px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          COMMENT ÇA MARCHE
      ══════════════════════════════════════ */}
      <section style={{ background: '#0f172a', padding: '100px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comment ça marche</span>
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: 'white', margin: '0 0 16px', letterSpacing: '-1px' }}>
              Démarrez en <span style={{ background: 'linear-gradient(135deg, #60a5fa, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>4 étapes</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
            {[
              { num: '01', icon: '👤', title: 'Créez votre compte', desc: 'Inscription en 30 secondes. Aucune carte requise pour l\'essai.', color: '#2563eb' },
              { num: '02', icon: '⚙️', title: 'Configurez vos actifs', desc: 'Choisissez vos cryptos, définissez vos alertes et seuils de confiance.', color: '#06b6d4' },
              { num: '03', icon: '🤖', title: 'L\'IA analyse 24/7', desc: 'Notre IA surveille en continu et envoie des signaux en temps réel.', color: '#8b5cf6' },
              { num: '04', icon: '📈', title: 'Tradez intelligemment', desc: 'Suivez les signaux, mesurez vos performances, optimisez.', color: '#10b981' },
            ].map((step, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${step.color}22`, border: `1px solid ${step.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '22px' }}>
                  {step.icon}
                </div>
                <div style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '13px', fontWeight: 800, color: 'rgba(255,255,255,0.1)', letterSpacing: '-0.5px' }}>{step.num}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'white', margin: '0 0 10px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '100px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Témoignages</span>
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>
              Ils nous font <span style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>confiance</span>
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>2 400+ traders utilisent TradingAI pour prendre de meilleures décisions.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: '#f8fafc', borderRadius: '20px', padding: '32px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <svg key={j} width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: '15px', color: '#374151', lineHeight: 1.7, margin: '0 0 24px', fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{t.avatar}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PRICING
      ══════════════════════════════════════ */}
      <section style={{ background: '#f8fafc', padding: '100px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tarifs</span>
            </div>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-1px' }}>
              Un plan pour chaque <span style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ambition</span>
            </h2>
            <p style={{ fontSize: '18px', color: '#64748b', margin: 0 }}>Commencez gratuitement. Évoluez quand vous êtes prêt.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'start' }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? 'linear-gradient(160deg, #1e3a8a, #1e40af)' : 'white',
                borderRadius: '24px', padding: '36px',
                border: plan.highlight ? '1px solid rgba(37,99,235,0.5)' : '1px solid #e2e8f0',
                boxShadow: plan.highlight ? '0 20px 60px rgba(37,99,235,0.2)' : '0 1px 3px rgba(0,0,0,0.04)',
                position: 'relative',
              }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: 'white', fontSize: '12px', fontWeight: 700, padding: '5px 18px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                    Le plus populaire
                  </div>
                )}
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: plan.highlight ? 'white' : '#0f172a', margin: '0 0 6px' }}>{plan.name}</h3>
                <p style={{ fontSize: '13px', color: plan.highlight ? 'rgba(255,255,255,0.6)' : '#94a3b8', margin: '0 0 20px' }}>{plan.desc}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '44px', fontWeight: 800, color: plan.highlight ? 'white' : '#0f172a', letterSpacing: '-2px' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: '16px', color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#94a3b8' }}>{plan.period}</span>}
                </div>
                <div style={{ height: '1px', background: plan.highlight ? 'rgba(255,255,255,0.12)' : '#f1f5f9', marginBottom: '24px' }} />
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: plan.highlight ? 'rgba(255,255,255,0.85)' : '#374151' }}>
                      <svg width="16" height="16" fill="none" stroke={plan.highlight ? '#60a5fa' : '#2563eb'} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{
                  display: 'block', textAlign: 'center', padding: '13px',
                  borderRadius: '12px', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                  background: plan.highlight ? 'white' : '#2563eb',
                  color: plan.highlight ? '#1e40af' : 'white',
                  transition: 'all 0.2s',
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '100px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-1px' }}>Questions fréquentes</h2>
            <p style={{ fontSize: '17px', color: '#64748b', margin: 0 }}>Tout ce que vous devez savoir sur TradingAI.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '20px 24px', background: openFaq === i ? '#f8fafc' : 'white',
                  border: 'none', cursor: 'pointer', textAlign: 'left', gap: '16px',
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{faq.q}</span>
                  <svg style={{ flexShrink: 0, width: '20px', height: '20px', color: '#94a3b8', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.7, margin: '16px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL — Dark
      ══════════════════════════════════════ */}
      <section style={{ background: '#060b14', padding: '120px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '800px', height: '400px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '32px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 600 }}>2 400 traders actifs en ce moment</span>
          </div>
          <h2 style={{ fontSize: '54px', fontWeight: 800, color: 'white', margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-2px' }}>
            Prêt à trader avec<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>l'IA ?</span>
          </h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', margin: '0 0 40px', lineHeight: 1.6 }}>
            Rejoignez des milliers de traders qui utilisent TradingAI pour prendre de meilleures décisions. Essai gratuit 14 jours.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '16px 36px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', fontSize: '16px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 40px rgba(37,99,235,0.35)',
            }}>
              Commencer gratuitement
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </Link>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', marginTop: '20px' }}>
            Gratuit pour toujours · Aucune carte bancaire · Annulation à tout moment
          </p>
        </div>
      </section>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
};

export default Home;
