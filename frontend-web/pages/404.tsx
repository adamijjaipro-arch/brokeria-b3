import Link from 'next/link';
import type { NextPage } from 'next';
import PageSEO from '../components/seo/PageSEO';

const NotFoundPage: NextPage = () => {
  return (
    <>
      <PageSEO
        title="Page introuvable (404) — Alvio"
        description="La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil Alvio."
        noindex={true}
      />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          fontFamily: "'Plus Jakarta Sans', Inter, sans-serif",
          color: '#FFFFFF',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="80" height="80" rx="20" fill="#111111" />
            <polygon points="40,16 68,60 12,60" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
            <polyline points="22,52 30,38 38,44 50,26 62,34" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="50" cy="26" r="4" fill="#10b981" />
          </svg>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Erreur 404
        </p>

        <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
          Page introuvable
        </h1>

        <p style={{ fontSize: '16px', color: '#888888', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 40px' }}>
          La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil pour continuer votre trading.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#3B82F6',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background 0.2s ease',
            }}
          >
            Retour à l'accueil
          </Link>

          <Link
            href="/markets"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#1A1A1A',
              border: '1px solid #2A2A2A',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            Voir les marchés
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFoundPage;
