import Link from 'next/link';
import type { NextPage } from 'next';
import PageSEO from '../components/seo/PageSEO';

const ServerErrorPage: NextPage = () => {
  return (
    <>
      <PageSEO
        title="Erreur serveur (500) — Alvio"
        description="Une erreur interne s'est produite sur Alvio. Notre équipe a été notifiée. Réessayez dans quelques instants."
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
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <svg width="36" height="36" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
        </div>

        <p style={{ fontSize: '14px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
          Erreur 500
        </p>

        <h1 style={{ fontSize: '40px', fontWeight: 800, color: '#FFFFFF', margin: '0 0 16px', lineHeight: 1.1 }}>
          Erreur interne du serveur
        </h1>

        <p style={{ fontSize: '16px', color: '#888888', maxWidth: '420px', lineHeight: 1.6, margin: '0 0 40px' }}>
          Une erreur inattendue s'est produite. Notre équipe technique a été notifiée automatiquement. Réessayez dans quelques instants.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              background: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Réessayer
          </button>

          <Link
            href="/"
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
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </>
  );
};

export default ServerErrorPage;
