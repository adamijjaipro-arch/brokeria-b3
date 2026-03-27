/**
 * Page de gestion de la sécurité MFA du compte
 * Accessible depuis /profile/security
 */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { totpApi, webAuthnApi } from '@/api';
import { useAuthStore } from '@/context/authStore';

interface WebAuthnCredential {
  id: string;
  deviceType: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function SecurityPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [credentials, setCredentials] = useState<WebAuthnCredential[]>([]);
  const [loading, setLoading] = useState(true);

  // Désactivation TOTP
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState('');
  const [disabling, setDisabling] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadSecurityData();
  }, [isAuthenticated]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [totpRes, credRes] = await Promise.all([
        totpApi.getStatus(),
        webAuthnApi.listCredentials(),
      ]);
      setTotpEnabled(totpRes.data.totpEnabled);
      setCredentials(credRes.data);
    } catch {
      // Silently fail — user will see empty state
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisabling(true);
    setDisableError('');
    try {
      await totpApi.disable(disableCode);
      setTotpEnabled(false);
      setShowDisableForm(false);
      setDisableCode('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Code invalide';
      setDisableError(msg);
    } finally {
      setDisabling(false);
    }
  };

  const handleRemoveCredential = async (credId: string) => {
    if (!confirm('Supprimer ce dispositif de sécurité ?')) return;
    try {
      await webAuthnApi.removeCredential(credId);
      setCredentials((prev) => prev.filter((c) => c.id !== credId));
    } catch {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <button
            onClick={() => router.push('/profile')}
            className="text-gray-400 hover:text-white text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Retour au profil
          </button>
          <h1 className="text-3xl font-bold text-white">Sécurité du compte</h1>
          <p className="mt-1 text-gray-400">Gérez vos facteurs d&apos;authentification</p>
        </div>

        {/* Facteurs actifs */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Facteurs actifs</h2>
          <div className="space-y-3">
            {/* Mot de passe — toujours actif */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔒</span>
                <div>
                  <p className="text-white font-medium">Mot de passe</p>
                  <p className="text-gray-400 text-xs">bcrypt 12 rounds — OWASP compliant</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-900/40 text-green-400 text-xs rounded-full">Actif</span>
            </div>

            {/* OTP Email — toujours actif */}
            <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="text-white font-medium">Code email (OTP)</p>
                  <p className="text-gray-400 text-xs">Code à 6 chiffres — TTL 10 min</p>
                </div>
              </div>
              <span className="px-2 py-1 bg-green-900/40 text-green-400 text-xs rounded-full">Actif</span>
            </div>
          </div>
        </div>

        {/* TOTP Section */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div>
                <h2 className="text-lg font-semibold text-white">TOTP (Application mobile)</h2>
                <p className="text-gray-400 text-xs">RFC 6238 — Google Authenticator, Authy</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              totpEnabled
                ? 'bg-green-900/40 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {totpEnabled ? 'Actif' : 'Inactif'}
            </span>
          </div>

          {totpEnabled ? (
            <div>
              {!showDisableForm ? (
                <button
                  onClick={() => setShowDisableForm(true)}
                  className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-xl text-sm transition-colors border border-red-900/30"
                >
                  Désactiver le TOTP
                </button>
              ) : (
                <form onSubmit={handleDisableTotp} className="space-y-3">
                  <p className="text-gray-400 text-sm">
                    Entrez un code TOTP valide pour désactiver
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center font-mono py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-red-500"
                  />
                  {disableError && (
                    <p className="text-red-400 text-xs text-center">{disableError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setShowDisableForm(false); setDisableCode(''); setDisableError(''); }}
                      className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={disabling || disableCode.length !== 6}
                      className="flex-1 py-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm"
                    >
                      {disabling ? 'Désactivation…' : 'Désactiver'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <button
              onClick={() => router.push('/auth/totp-setup')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Configurer TOTP
            </button>
          )}
        </div>

        {/* WebAuthn Section */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔑</span>
              <div>
                <h2 className="text-lg font-semibold text-white">Clés de sécurité</h2>
                <p className="text-gray-400 text-xs">WebAuthn / FIDO2 — Empreinte, clé hardware</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              credentials.length > 0
                ? 'bg-green-900/40 text-green-400'
                : 'bg-gray-700 text-gray-400'
            }`}>
              {credentials.length} dispositif{credentials.length !== 1 ? 's' : ''}
            </span>
          </div>

          {credentials.length > 0 && (
            <div className="space-y-2 mb-4">
              {credentials.map((cred) => (
                <div
                  key={cred.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-xl"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {cred.deviceType === 'multiDevice' ? '☁️ Passkey' : '🔑 Clé hardware'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      Ajouté le {new Date(cred.createdAt).toLocaleDateString('fr-FR')}
                      {cred.lastUsedAt && ` · Utilisé le ${new Date(cred.lastUsedAt).toLocaleDateString('fr-FR')}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveCredential(cred.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded-lg hover:bg-red-900/20 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => router.push('/auth/webauthn-setup')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            + Ajouter un dispositif
          </button>
        </div>

      </div>
    </div>
  );
}
