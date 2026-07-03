import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import PageSEO from '../../components/seo/PageSEO';

const LockedPage: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <PageSEO title="Compte bloqué — Alvio" description="Votre compte Alvio est temporairement verrouillé. Contactez le support pour le débloquer." noindex={true} />
      <Head><title>Compte bloqué — Alvio</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '420px', padding: '40px', background: 'white', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', textAlign: 'center' }}>

          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="32" height="32" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: '0 0 12px' }}>Compte temporairement bloqué</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px', lineHeight: '1.6' }}>
            Votre compte a été bloqué suite à <strong>3 tentatives échouées</strong>.
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 28px', lineHeight: '1.6' }}>
            Le blocage est automatiquement levé après <strong>30 minutes</strong>.<br />
            Vous pouvez réessayer ultérieurement.
          </p>

          <div style={{ background: '#fef3c7', borderRadius: '12px', padding: '14px 16px', border: '1px solid #fcd34d', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: '#92400e', margin: 0, fontWeight: 500 }}>
              ⚠️ Si vous n'êtes pas à l'origine de ces tentatives, veuillez sécuriser votre compte en changeant votre mot de passe.
            </p>
          </div>

          <button onClick={() => router.push('/login')} style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none',
            background: '#2563eb', color: 'white', fontSize: '14px',
            fontWeight: 700, cursor: 'pointer', width: '100%',
          }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    </>
  );
};

export default LockedPage;
