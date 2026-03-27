import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ThemeToggleButton from '@/components/common/ThemeToggleButton';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_LINKS = [
  { href: '/dashboard',  label: 'Dashboard' },
  { href: '/signals',    label: 'Signaux' },
  { href: '/simulator',  label: 'Simulateur' },
  { href: '/formation',  label: 'Formation' },
  { href: '/reports',    label: 'Rapports' },
  { href: '/pricing',    label: 'Tarifs' },
];

const FOOTER_COLS = [
  {
    title: 'Produit',
    links: [
      { label: 'Signaux IA',  href: '/signals' },
      { label: 'Simulateur',  href: '/simulator' },
      { label: 'Dashboard',   href: '/dashboard' },
      { label: 'Rapports',    href: '/reports' },
    ],
  },
  {
    title: 'Entreprise',
    links: [
      { label: 'Tarifs',    href: '/pricing' },
      { label: 'À propos',  href: '#' },
      { label: 'Blog',      href: '#' },
      { label: 'Contact',   href: '#' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Confidentialité',   href: '#' },
      { label: 'CGU',               href: '#' },
      { label: 'Mentions légales',  href: '#' },
    ],
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [mobileOpen, setMobileOpen]       = useState(false);
  const [scrolled, setScrolled]           = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  }, [router.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    router.push('/');
  };

  /* ── styles ─────────────────────────────────────────── */
  const NAV_BG = scrolled
    ? 'rgba(6, 11, 20, 0.98)'
    : 'rgba(6, 11, 20, 0.75)';

  const navStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 1000,
    background: NAV_BG,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
    transition: 'all 0.3s ease',
  };

  const innerNav: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '24px',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#060b14' }}>

      {/* ══════════════════════════
          NAV BAR
      ══════════════════════════ */}
      <nav style={navStyle}>
        <div style={innerNav}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(37,99,235,0.45)',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
              </svg>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
              Broker<span style={{ background: 'linear-gradient(90deg,#2563eb,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IA</span>
            </span>
          </Link>

          {/* Desktop nav links — côte à côte */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
            {NAV_LINKS.map((link) => {
              const active = router.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '9px',
                    fontSize: '14px',
                    fontWeight: active ? 700 : 500,
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: active ? 'rgba(37,99,235,0.25)' : 'transparent',
                    border: active ? '1px solid rgba(37,99,235,0.4)' : '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <ThemeToggleButton />
            {isLoggedIn ? (
              <>
                <Link href="/profile" style={{
                  padding: '8px 18px', borderRadius: '9px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', background: 'rgba(255,255,255,0.05)',
                  transition: 'all 0.15s',
                }}>Mon Profil</Link>
                <button onClick={handleLogout} style={{
                  padding: '8px 18px', borderRadius: '9px', border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  transition: 'color 0.15s',
                }}>Déconnexion</button>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  padding: '8px 18px', borderRadius: '9px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600,
                  textDecoration: 'none', background: 'rgba(255,255,255,0.04)',
                  transition: 'all 0.15s',
                }}>Se connecter</Link>
                <Link href="/register" style={{
                  padding: '8px 18px', borderRadius: '9px', border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(37,99,235,0.4)',
                  transition: 'all 0.15s',
                }}>Commencer gratuitement</Link>
              </>
            )}
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: 'none',
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: '6px',
            }}
            className="mobile-burger"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            background: 'rgba(6,11,20,0.99)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            padding: '16px 24px 24px',
          }}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block', padding: '12px 16px', borderRadius: '10px',
                  color: router.pathname === link.href ? '#60a5fa' : 'rgba(255,255,255,0.7)',
                  fontWeight: 500, fontSize: '15px', textDecoration: 'none',
                  marginBottom: '4px',
                }}
              >{link.label}</Link>
            ))}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
            {isLoggedIn ? (
              <button onClick={handleLogout} style={{ color: '#f87171', background: 'none', border: 'none', fontSize: '14px', cursor: 'pointer', padding: '8px 16px' }}>
                Déconnexion
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link href="/login" style={{ padding: '11px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>Se connecter</Link>
                <Link href="/register" style={{ padding: '11px', borderRadius: '10px', background: '#2563eb', color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 700 }}>Commencer gratuitement</Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ══════════════════════════
          CONTENT
      ══════════════════════════ */}
      <main>{children}</main>

      {/* ══════════════════════════
          FOOTER DARK
      ══════════════════════════ */}
      <footer style={{ background: '#06090f', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 32px' }}>

          {/* Top grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#fff" />
                  </svg>
                </div>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                  Broker<span style={{ background: 'linear-gradient(90deg,#2563eb,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IA</span>
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', maxWidth: '260px', marginBottom: '24px' }}>
                La plateforme IA qui analyse les marchés crypto en temps réel. Signaux précis, patterns avancés et simulateur DCA.
              </p>
              {/* Social icons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { letter: 'T', label: 'Twitter' },
                  { letter: 'D', label: 'Discord' },
                  { letter: 'T', label: 'Telegram' },
                ].map((s, i) => (
                  <a key={i} href="#" style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: 700,
                    textDecoration: 'none', transition: 'all 0.15s',
                  }}>{s.letter}</a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>
                  {col.title}
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.15s' }}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 0 28px' }} />

          {/* Bottom bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              © 2026 BrokerIA. Tous droits réservés. Les performances passées ne garantissent pas les résultats futurs.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '11px', fontWeight: 600, color: '#10b981',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                padding: '4px 10px', borderRadius: '20px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                Système opérationnel
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>v2.0</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .mobile-burger { display: block !important; }
          .nav-desktop-links, .nav-desktop-cta { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
