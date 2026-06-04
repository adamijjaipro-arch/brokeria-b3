import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { authApi } from '../../api';
import ThemeToggleButton from '../common/ThemeToggleButton';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

interface UserProfile {
  username: string;
  email: string;
  subscription?: string;
}

const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: '/markets',
    label: 'Marchés',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 20V10m4 10V4m4 16v-7m4 7v-3" />
      </svg>
    ),
  },
  {
    href: '/signals',
    label: 'Signaux',
    badge: '12',
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    href: '/simulator',
    label: 'Simulateur',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    href: '/strategies',
    label: 'Stratégies',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    href: '/strategies/import',
    label: 'Importer PDF',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    href: '/formation',
    label: 'Formation',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    href: '/reports',
    label: 'Rapports',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Communauté',
    badge: null,
    disabled: true,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Paramètres',
    badge: null,
    disabled: false,
    icon: (
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

const AppLayout: React.FC<AppLayoutProps> = ({ children, title, subtitle }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    authApi.getProfile().then(({ data }) => setUser(data as UserProfile)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await import('../../api').then(({ default: api }) => api.post('/auth/logout'));
    } catch {}
    import('../../context/authStore').then(({ useAuthStore }) => {
      useAuthStore.getState().clearAuth();
    });
    router.push('/login');
  };

  const displayName = user?.username ?? '…';
  const avatarLetters = user ? initials(user.username) : '?';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, zIndex: 50,
        display: 'flex', flexDirection: 'column',
        width: '320px', height: '100vh',
        background: '#0d1117',
        borderRight: '1px solid #161b22',
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 20px 16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l4-8 4 4 4-6 4 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 17h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
            Trading<span style={{ background: 'linear-gradient(90deg,#2563eb,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </div>

        {/* Nav label */}
        <p style={{ margin: '0 0 8px', padding: '0 20px', fontSize: '11px', fontWeight: 700, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Navigation
        </p>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const isActive = !item.disabled && (
              router.pathname === item.href ||
              (item.href !== '/dashboard' && item.href !== '#' && router.pathname.startsWith(item.href))
            );

            if (item.disabled) {
              return (
                <div key={item.label} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 8px', borderRadius: '16px', opacity: 0.35, cursor: 'not-allowed',
                  color: '#6b7280', position: 'relative',
                }}>
                  {item.icon}
                  <span style={{ fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>{item.label}</span>
                  <span style={{
                    position: 'absolute', top: '10px', right: '16px',
                    fontSize: '9px', fontWeight: 700, color: '#4b5563',
                    background: '#1f2937', padding: '2px 6px', borderRadius: '4px',
                  }}>Bientôt</span>
                </div>
              );
            }

            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '16px 8px', borderRadius: '16px', cursor: 'pointer',
                  position: 'relative',
                  background: isActive ? '#2563eb' : 'transparent',
                  color: isActive ? '#ffffff' : '#6b7280',
                  transition: 'all 0.15s ease',
                }}>
                  {item.icon}
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 600, marginTop: '6px' }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      position: 'absolute', top: '10px', right: '16px',
                      fontSize: '10px', fontWeight: 700, color: '#fff',
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#2563eb',
                      padding: '2px 7px', borderRadius: '20px',
                    }}>{item.badge}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #161b22' }}>
          <div
            onClick={handleLogout}
            title="Se déconnecter"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
              borderRadius: '12px', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#161b22')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '13px', fontWeight: 700,
            }}>
              {avatarLetters}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#4b5563' }}>Se déconnecter</p>
            </div>
            <svg width="14" height="14" fill="none" stroke="#4b5563" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </div>
      </aside>

      {/* ══════════════ MAIN ══════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', marginLeft: '320px', overflow: 'hidden', background: '#f0f2f5' }}>

        {/* Topbar */}
        <header style={{
          flexShrink: 0, display: 'flex', alignItems: 'center', gap: '12px',
          padding: '0 24px', height: '64px',
          background: '#fff', borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              style={{
                width: '100%', padding: '8px 12px 8px 36px', border: '1px solid #e5e7eb',
                borderRadius: '10px', fontSize: '14px', color: '#111827',
                background: '#f9fafb', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <ThemeToggleButton />
            {/* Notifications */}
            <button style={{
              position: 'relative', padding: '8px', background: 'transparent',
              border: 'none', borderRadius: '10px', cursor: 'pointer', color: '#6b7280',
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span style={{ position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
            </button>

            {/* User chip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '6px 12px', background: '#f9fafb',
              border: '1px solid #e5e7eb', borderRadius: '10px', cursor: 'pointer',
            }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '11px', fontWeight: 700,
              }}>{avatarLetters}</div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{displayName}</span>
              <svg width="12" height="12" fill="none" stroke="#9ca3af" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {(title || subtitle) && (
            <div style={{ marginBottom: '20px' }}>
              {title && <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{title}</h1>}
              {subtitle && <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{subtitle}</p>}
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
