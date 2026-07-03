/**
 * Page de vérification TOTP lors de la connexion
 * Appelée après la vérification du mot de passe quand TOTP est activé.
 */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { totpApi } from '@/api';
import PageSEO from '@/components/seo/PageSEO';

export default function TotpVerifyPage() {
  const router = useRouter();
  const [code, setCode]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await totpApi.verify(code);
      // Rediriger vers le dashboard après vérification TOTP réussie
      await router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Code TOTP invalide ou expiré';
      setError(msg);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <PageSEO
        title="Vérification TOTP — Alvio"
        description="Vérifiez votre code TOTP pour accéder à votre compte Alvio."
        noindex={true}
      />
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-900/40 mb-4">
            <span className="text-3xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Code TOTP</h1>
          <p id="totp-help-text" className="mt-2 text-gray-400 text-sm">
            Saisissez le code de votre application d&apos;authentification
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            aria-describedby="totp-help-text"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full text-center text-3xl tracking-[0.5em] font-mono py-4 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
            autoFocus
          />

          {error && (
            <p role="alert" aria-live="polite" className="text-red-400 text-sm text-center bg-red-900/20 rounded-lg py-2 px-4">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors"
          >
            {loading ? 'Vérification…' : 'Vérifier'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-500">
          Code valide pendant 30 secondes — tolérance ±30s
        </p>
      </div>
    </div>
  );
}
