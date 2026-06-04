import React, { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';

/* ───────────────────────────────────────────
   DATA
─────────────────────────────────────────── */
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    badge: null,
    desc: 'Pour découvrir la puissance de l\'IA',
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: 'Gratuit',
    period: '',
    color: '#64748b',
    highlight: false,
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      { text: '3 signaux / jour', included: true },
      { text: '1 pattern détecté', included: true },
      { text: 'Dashboard basique', included: true },
      { text: 'Accès communauté', included: true },
      { text: 'Alertes Telegram', included: false },
      { text: 'Simulateur DCA', included: false },
      { text: 'Rapports IA avancés', included: false },
      { text: 'API Access', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Le plus populaire',
    desc: 'Pour les traders sérieux qui veulent performer',
    monthlyPrice: 29,
    yearlyPrice: 290,
    priceLabel: null,
    period: '/mois',
    color: '#2563eb',
    highlight: true,
    cta: 'Essai gratuit 14 jours',
    ctaHref: '/register',
    features: [
      { text: 'Signaux illimités', included: true },
      { text: '15+ patterns auto', included: true },
      { text: 'Dashboard complet', included: true },
      { text: 'Accès communauté', included: true },
      { text: 'Alertes Telegram & Email', included: true },
      { text: 'Simulateur DCA complet', included: true },
      { text: 'Rapports IA avancés', included: true },
      { text: 'API Access', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    badge: null,
    desc: 'Pour les professionnels et fonds d\'investissement',
    monthlyPrice: 79,
    yearlyPrice: 790,
    priceLabel: null,
    period: '/mois',
    color: '#8b5cf6',
    highlight: false,
    cta: 'Contacter l\'équipe',
    ctaHref: '/register',
    features: [
      { text: 'Tout le plan Pro', included: true },
      { text: 'API Access complet', included: true },
      { text: 'Stratégies custom IA', included: true },
      { text: 'Account manager dédié', included: true },
      { text: 'Alertes multi-canal', included: true },
      { text: 'Webinaires exclusifs', included: true },
      { text: 'Accès bêta anticipé', included: true },
      { text: 'White-label options', included: true },
    ],
  },
];

const FAQS = [
  {
    q: 'Comment fonctionne l\'essai gratuit ?',
    a: 'L\'essai Pro de 14 jours est entièrement gratuit. Aucune carte bancaire requise. Vous accédez à toutes les fonctionnalités Pro sans restriction.',
  },
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement est immédiat et la facturation est recalculée au prorata.',
  },
  {
    q: 'Comment fonctionne la facturation annuelle ?',
    a: 'En optant pour la facturation annuelle, vous économisez l\'équivalent de 2 mois offerts. Le montant est débité en une seule fois pour l\'année complète.',
  },
  {
    q: 'L\'annulation est-elle possible à tout moment ?',
    a: 'Absolument. Sans engagement, sans frais cachés. Votre accès reste actif jusqu\'à la fin de la période de facturation en cours.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'Nous acceptons toutes les cartes bancaires (Visa, Mastercard, Amex) et PayPal. Paiement sécurisé via Stripe.',
  },
];

const STATS = [
  { val: '2 400+', label: 'Traders actifs' },
  { val: '95.2%', label: 'Précision des signaux' },
  { val: '14 jours', label: 'Essai gratuit' },
  { val: '24/7', label: 'Support & analyse' },
];

/* ───────────────────────────────────────────
   PAGE
─────────────────────────────────────────── */
const PricingPage: NextPage = () => {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const ff = "'Plus Jakarta Sans', sans-serif";

  return (
    <Layout>
      <Head>
        <title>Tarifs — Alvio</title>
        <meta name="description" content="Plans et tarifs Alvio. Essai gratuit 14 jours. Aucune carte bancaire requise." />
      </Head>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #060b14 0%, #0a1628 50%, #0d1f3c 100%)',
        padding: '120px 24px 80px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: ff,
      }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-100px', left: '20%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-50px', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(37,99,235,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 18px', borderRadius: '99px', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '13px', color: '#93c5fd', fontWeight: 600 }}>Essai gratuit · Aucune carte bancaire</span>
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 5vw, 62px)', fontWeight: 800, color: 'white', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-2px' }}>
            Un plan pour chaque<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              ambition
            </span>
          </h1>

          <p style={{ fontSize: '18px', color: '#94a3b8', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto 40px' }}>
            Commencez gratuitement. Évoluez quand vous êtes prêt. Annulation à tout moment.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: '0 0 2px', letterSpacing: '-0.5px' }}>{s.val}</p>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '4px' }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: '9px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: !annual ? 'rgba(37,99,235,0.9)' : 'transparent',
                color: !annual ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: 600, transition: 'all 0.2s',
                fontFamily: ff,
              }}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: '9px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: annual ? 'rgba(37,99,235,0.9)' : 'transparent',
                color: annual ? 'white' : 'rgba(255,255,255,0.5)',
                fontSize: '14px', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                fontFamily: ff,
              }}
            >
              Annuel
              <span style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white', fontSize: '11px', fontWeight: 700,
                padding: '1px 8px', borderRadius: '20px',
              }}>-17%</span>
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          PLANS
      ══════════════════════════════════════ */}
      <section style={{ background: '#060b14', padding: '0 24px 100px', fontFamily: ff }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Cards — overlap the hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
            {PLANS.map((plan) => {
              const price = plan.priceLabel
                ? plan.priceLabel
                : annual
                ? `${plan.yearlyPrice}€`
                : `${plan.monthlyPrice}€`;
              const period = plan.period ? (annual ? '/an' : plan.period) : '';

              return (
                <div key={plan.id} style={{
                  background: plan.highlight
                    ? 'linear-gradient(160deg, #1e3a8a 0%, #1e40af 60%, #1d4ed8 100%)'
                    : 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  border: plan.highlight
                    ? '1px solid rgba(37,99,235,0.6)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '24px',
                  padding: '36px',
                  position: 'relative',
                  boxShadow: plan.highlight
                    ? '0 32px 80px rgba(37,99,235,0.25), 0 0 0 1px rgba(37,99,235,0.3)'
                    : '0 8px 32px rgba(0,0,0,0.3)',
                  transform: plan.highlight ? 'translateY(-8px)' : 'none',
                  transition: 'transform 0.2s',
                }}>
                  {/* Popular badge */}
                  {plan.badge && (
                    <div style={{
                      position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #2563eb, #8b5cf6)',
                      color: 'white', fontSize: '12px', fontWeight: 700,
                      padding: '5px 20px', borderRadius: '99px', whiteSpace: 'nowrap',
                      boxShadow: '0 4px 16px rgba(37,99,235,0.4)',
                    }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* Plan name */}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                      color: plan.highlight ? 'rgba(255,255,255,0.5)' : '#475569',
                    }}>Plan</span>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: '2px 0 0', letterSpacing: '-0.5px' }}>
                      {plan.name}
                    </h2>
                  </div>

                  <p style={{ fontSize: '13px', color: plan.highlight ? 'rgba(255,255,255,0.55)' : '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
                    {plan.desc}
                  </p>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '28px' }}>
                    <span style={{ fontSize: '52px', fontWeight: 800, color: 'white', letterSpacing: '-3px', lineHeight: 1 }}>
                      {price}
                    </span>
                    {period && (
                      <span style={{ fontSize: '15px', color: plan.highlight ? 'rgba(255,255,255,0.45)' : '#475569', fontWeight: 500 }}>
                        {period}
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={plan.ctaHref} style={{
                    display: 'block', textAlign: 'center',
                    padding: '13px 24px', borderRadius: '13px',
                    fontWeight: 700, fontSize: '14px', textDecoration: 'none',
                    background: plan.highlight
                      ? 'white'
                      : plan.id === 'elite'
                        ? 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.15))'
                        : 'rgba(255,255,255,0.08)',
                    color: plan.highlight ? '#1e40af' : 'white',
                    border: plan.highlight
                      ? 'none'
                      : plan.id === 'elite'
                        ? '1px solid rgba(139,92,246,0.4)'
                        : '1px solid rgba(255,255,255,0.12)',
                    transition: 'all 0.2s',
                    marginBottom: '28px',
                    boxShadow: plan.highlight ? '0 4px 20px rgba(255,255,255,0.15)' : 'none',
                  }}>
                    {plan.cta}
                  </Link>

                  {/* Divider */}
                  <div style={{ height: '1px', background: plan.highlight ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)', marginBottom: '24px' }} />

                  {/* Features */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {plan.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {f.included ? (
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            background: plan.highlight ? 'rgba(255,255,255,0.2)' : 'rgba(37,99,235,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="11" height="11" fill="none" stroke={plan.highlight ? 'white' : '#60a5fa'} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div style={{
                            width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.04)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <svg width="11" height="11" fill="none" stroke="rgba(255,255,255,0.2)" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        <span style={{
                          fontSize: '13px', fontWeight: 500,
                          color: f.included
                            ? plan.highlight ? 'rgba(255,255,255,0.88)' : '#e2e8f0'
                            : 'rgba(255,255,255,0.25)',
                        }}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Trust line */}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <p style={{ fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {['🔒 Paiement sécurisé Stripe', '✅ Annulation à tout moment', '💳 Sans carte bancaire (essai)', '⭐ 2 400+ traders nous font confiance'].map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURE COMPARISON TABLE
      ══════════════════════════════════════ */}
      <section style={{ background: '#06090f', padding: '80px 24px', fontFamily: ff }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '99px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comparaison</span>
            </div>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: 'white', margin: '0 0 12px', letterSpacing: '-1px' }}>
              Tout comparer en un coup d'œil
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Choisissez le plan qui correspond à vos besoins.</p>
          </div>

          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ padding: '20px 24px' }}>
                <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>Fonctionnalité</span>
              </div>
              {['Starter', 'Pro', 'Elite'].map((p, i) => (
                <div key={i} style={{ padding: '20px 24px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.07)', background: i === 1 ? 'rgba(37,99,235,0.08)' : 'transparent' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: i === 1 ? '#60a5fa' : 'white' }}>{p}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {[
              { label: 'Signaux par jour', values: ['3', '∞', '∞'] },
              { label: 'Patterns détectés', values: ['1', '15+', '15+'] },
              { label: 'Dashboard analytics', values: ['Basique', 'Complet', 'Complet'] },
              { label: 'Simulateur DCA', values: [false, true, true] },
              { label: 'Alertes Telegram', values: [false, true, true] },
              { label: 'Rapports IA', values: [false, true, true] },
              { label: 'Support', values: ['Communauté', 'Prioritaire', 'Dédié'] },
              { label: 'API Access', values: [false, false, true] },
              { label: 'Stratégies custom', values: [false, false, true] },
              { label: 'Webinaires', values: [false, false, true] },
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>{row.label}</span>
                </div>
                {row.values.map((val, vi) => (
                  <div key={vi} style={{ padding: '16px 24px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', background: vi === 1 ? 'rgba(37,99,235,0.05)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {typeof val === 'boolean' ? (
                      val ? (
                        <svg width="18" height="18" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.15)" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )
                    ) : (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: vi === 1 ? '#93c5fd' : '#e2e8f0' }}>{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section style={{ background: '#060b14', padding: '80px 24px', fontFamily: ff }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <h2 style={{ fontSize: '38px', fontWeight: 800, color: 'white', margin: '0 0 12px', letterSpacing: '-1px' }}>
              Questions fréquentes
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Tout ce que vous devez savoir sur nos tarifs.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{
                background: openFaq === i ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.03)',
                border: openFaq === i ? '1px solid rgba(37,99,235,0.3)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: '14px', overflow: 'hidden', transition: 'all 0.2s',
              }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                    textAlign: 'left', gap: '16px', fontFamily: ff,
                  }}
                >
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'white' }}>{faq.q}</span>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    background: openFaq === i ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <svg
                      style={{ width: '14px', height: '14px', color: openFaq === i ? '#60a5fa' : '#64748b', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.75, margin: '16px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)',
        padding: '100px 24px', fontFamily: ff,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '300px', background: 'radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: '28px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            <span style={{ fontSize: '13px', color: '#6ee7b7', fontWeight: 600 }}>Rejoignez 2 400+ traders actifs</span>
          </div>

          <h2 style={{ fontSize: '48px', fontWeight: 800, color: 'white', margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-2px' }}>
            Prêt à trader avec<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #2563eb, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              l'Intelligence Artificielle ?
            </span>
          </h2>

          <p style={{ fontSize: '17px', color: '#64748b', margin: '0 0 36px', lineHeight: 1.6 }}>
            Essai gratuit 14 jours. Sans carte bancaire. Sans engagement.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '15px 32px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white', fontSize: '15px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 0 40px rgba(37,99,235,0.35)',
            }}>
              Commencer gratuitement
              <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '15px 28px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.75)', fontSize: '15px', fontWeight: 600, textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)',
            }}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PricingPage;
