/**
 * Page d'enrôlement TOTP (Google Authenticator / Authy)
 *
 * Flux :
 *  1. Appel POST /mfa/totp/enroll/init → QR code + secret backup
 *  2. Utilisateur scanne le QR avec son app TOTP
 *  3. Saisit un code à 6 chiffres pour confirmer
 *  4. POST /mfa/totp/enroll/confirm → TOTP activé
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { totpApi } from '@/api';
import PageSEO from '@/components/seo/PageSEO';

type Step = 'loading' | 'scan' | 'confirm' | 'success' | 'error';

export default function TotpSetupPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('loading');
  const [qrCode, setQrCode]     = useState<string>('');
  const [secret, setSecret]     = useState<string>('');
  const [code, setCode]         = useState<string>('');
  const [error, setError]       = useState<string>('');
  const [loading, setLoading]   = useState(false);

  // ── Étape 1 : récupérer QR code ─────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    totpApi.enrollInit()
      .then(({ data }) => {
        if (!mounted) return;
        setQrCode(data.qrCodeDataUrl);
        setSecret(data.secret);
        setStep('scan');
      })
      .catch((err) => {
        if (!mounted) return;
        const msg = err?.response?.data?.message ?? 'Erreur lors de l\'initialisation TOTP';
        setError(msg);
        setStep('error');
      });
    return () => { mounted = false; };
  }, []);

  // ── Étape 2 : confirmation du premier code ──────────────────────────────
  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await totpApi.enrollConfirm(code);
      setStep('success');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Code invalide, réessayez';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <PageSEO
        title="Configuration TOTP — Alvio"
        description="Activez l'authentification à deux facteurs TOTP sur votre compte Alvio pour une sécurité renforcée."
        noindex={true}
      />
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/40 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Configurer TOTP</h1>
          <p className="mt-2 text-gray-400 text-sm">
            Authentification à deux facteurs via application mobile
          </p>
        </div>

        {/* Loading */}
        {step === 'loading' && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500 mx-auto" />
            <p className="mt-4 text-gray-400">Génération du QR code…</p>
          </div>
        )}

        {/* Scan QR */}
        {step === 'scan' && (
          <div className="space-y-6">
            <ol className="space-y-2 text-sm text-gray-400 list-decimal list-inside">
              <li>Installez <strong className="text-white">Google Authenticator</strong> ou <strong className="text-white">Authy</strong></li>
              <li>Scannez le QR code ci-dessous</li>
              <li>Saisissez le code à 6 chiffres affiché</li>
            </ol>

            {qrCode && (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-xl">
                  <img src={qrCode} alt="QR Code TOTP" width={200} height={200} />
                </div>
              </div>
            )}

            {/* Secret backup */}
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Afficher le secret (saisie manuelle)
              </summary>
              <p className="mt-2 font-mono text-xs text-indigo-400 break-all bg-gray-800 rounded-lg p-3 select-all">
                {secret}
              </p>
            </details>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
            >
              J&apos;ai scanné le QR code →
            </button>
          </div>
        )}

        {/* Confirm code */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirm} className="space-y-6">
            <p className="text-sm text-gray-400 text-center">
              Saisissez le code à 6 chiffres affiché dans votre application
            </p>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg py-2 px-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('scan')}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
              >
                {loading ? 'Vérification…' : 'Activer TOTP'}
              </button>
            </div>
          </form>
        )}

        {/* Success */}
        {step === 'success' && (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/40">
              <span className="text-3xl">✅</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">TOTP activé !</h2>
              <p className="mt-2 text-gray-400 text-sm">
                Votre authentification à deux facteurs est configurée. Utilisez votre application à chaque connexion.
              </p>
            </div>
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
            >
              Retour au profil
            </button>
          </div>
        )}

        {/* Error */}
        {step === 'error' && (
          <div className="text-center space-y-4">
            <p className="text-red-400 bg-red-900/20 rounded-lg py-3 px-4">{error}</p>
            <button
              onClick={() => router.push('/profile')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-colors"
            >
              Retour au profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
