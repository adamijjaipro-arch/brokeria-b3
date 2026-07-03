/**
 * Page d'enrôlement WebAuthn (empreinte digitale / clé hardware)
 *
 * Dépendance : @simplewebauthn/browser (côté client uniquement)
 *
 * Flux :
 *  1. POST /mfa/webauthn/register/options → challenge
 *  2. navigator.credentials.create() → réponse authenticateur
 *  3. POST /mfa/webauthn/register/verify → credential stockée
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { webAuthnApi } from '@/api';
import PageSEO from '@/components/seo/PageSEO';

type Step = 'idle' | 'loading' | 'success' | 'error';

export default function WebAuthnSetupPage() {
  const router = useRouter();
  const [step, setStep]   = useState<Step>('idle');
  const [error, setError] = useState('');
  const [credentialName, setCredentialName] = useState('');

  const handleRegister = async () => {
    setStep('loading');
    setError('');
    try {
      // Importer dynamiquement (API WebAuthn n'est disponible que côté client)
      const { startRegistration } = await import('@simplewebauthn/browser');

      // Récupère les options du serveur
      const { data: options } = await webAuthnApi.registrationOptions();

      // Lance la cérémonie WebAuthn (dialogue OS : biométrie / clé hardware)
      const registrationResponse = await startRegistration(options as Parameters<typeof startRegistration>[0]);

      // Envoie la réponse au serveur pour vérification
      await webAuthnApi.registrationVerify(registrationResponse as unknown as Record<string, unknown>);

      setStep('success');
    } catch (err: unknown) {
      if ((err as DOMException)?.name === 'NotAllowedError') {
        setError('Opération annulée ou refusée par l\'utilisateur');
      } else {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          ?? 'Erreur lors de l\'enrôlement WebAuthn';
        setError(msg);
      }
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <PageSEO
        title="Configuration WebAuthn — Alvio"
        description="Enregistrez votre clé de sécurité ou empreinte digitale WebAuthn pour une authentification sans mot de passe sur Alvio."
        noindex={true}
      />
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-900/40 mb-4">
            <span className="text-3xl">🔑</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Clé de sécurité</h1>
          <p className="mt-2 text-gray-400 text-sm">
            Enregistrez une clé hardware (YubiKey) ou votre empreinte digitale
          </p>
        </div>

        {step === 'idle' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {[
                { icon: '💻', title: 'Touch ID / Face ID', desc: 'Empreinte digitale ou reconnaissance faciale' },
                { icon: '🔐', title: 'Clé hardware', desc: 'YubiKey, Titan, etc.' },
                { icon: '📱', title: 'Passkey', desc: 'Authentification sur un autre appareil' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{item.title}</p>
                    <p className="text-gray-400 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleRegister}
              className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors"
            >
              Enregistrer un dispositif
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="text-center py-12 space-y-4">
            <div className="animate-pulse text-5xl">🔑</div>
            <p className="text-white font-medium">En attente de votre dispositif…</p>
            <p className="text-gray-400 text-sm">
              Suivez les instructions de votre OS (Touch ID, clé USB, etc.)
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/40">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dispositif enregistré !</h2>
              <p className="mt-2 text-gray-400 text-sm">
                Vous pouvez maintenant utiliser ce dispositif pour vous authentifier.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRegister}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors text-sm"
              >
                Ajouter un autre
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <p className="text-red-400 bg-red-900/20 rounded-lg py-3 px-4 text-sm text-center">
              {error}
            </p>
            <button
              onClick={() => setStep('idle')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        <button
          onClick={() => router.push('/profile')}
          className="mt-4 w-full py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
        >
          Ignorer pour l&apos;instant
        </button>
      </div>
    </div>
  );
}
