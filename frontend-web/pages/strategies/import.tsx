import React, { useState, useRef, useCallback, DragEvent } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StrategyRules {
  entry_conditions: string[];
  exit_conditions:  string[];
  indicators:       string[];
  risk_management:  string[];
}

interface ImportResult {
  message:  string;
  strategy: { id: string; name: string; timeframe: string; asset: string };
  rules:    StrategyRules;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1D'] as const;
const MAX_SIZE   = 10 * 1024 * 1024;
const ACCEPTED   = ['application/pdf', 'text/plain', 'text/markdown', 'text/x-markdown'];

// ─── Styles ───────────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius:    '16px',
  padding:         '24px',
  boxShadow:       '0 1px 3px rgba(0,0,0,0.07)',
};

const input: React.CSSProperties = {
  width:          '100%',
  padding:        '10px 12px',
  border:         '1px solid #e5e7eb',
  borderRadius:   '10px',
  fontSize:       '14px',
  color:          '#111827',
  background:     'white',
  outline:        'none',
  boxSizing:      'border-box',
};

// ─── RulesCard ────────────────────────────────────────────────────────────────

interface RulesCardProps {
  title:       string;
  items:       string[];
  accent:      string;
  bg:          string;
  border:      string;
  emptyLabel?: string;
}

const RulesCard: React.FC<RulesCardProps> = ({ title, items, accent, bg, border, emptyLabel }) => (
  <div style={card}>
    <h3 style={{ fontSize: '12px', fontWeight: 700, color: accent, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {title}
    </h3>
    {items.length === 0 ? (
      <p style={{ fontSize: '13px', color: '#9ca3af', margin: 0 }}>{emptyLabel ?? 'Aucune règle détectée.'}</p>
    ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item, i) => (
          <div key={i} style={{ background: bg, borderRadius: '8px', padding: '8px 12px', border: `1px solid ${border}` }}>
            <p style={{ fontSize: '13px', color: '#111827', margin: 0, lineHeight: '1.5' }}>{item}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ImportStrategyPage: NextPage = () => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file,        setFile]        = useState<File | null>(null);
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [timeframe,   setTimeframe]   = useState('1h');
  const [asset,       setAsset]       = useState('');
  const [isDragging,  setIsDragging]  = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [result,      setResult]      = useState<ImportResult | null>(null);

  // ── File validation & pick ─────────────────────────────────────────────────

  const validateAndPick = useCallback((f: File) => {
    if (f.size > MAX_SIZE) { setError('Fichier trop lourd — maximum 10 Mo.'); return; }
    const isOk = ACCEPTED.includes(f.type) || f.name.endsWith('.md') || f.name.endsWith('.txt');
    if (!isOk) { setError('Format non accepté. Utilisez PDF, TXT ou MD.'); return; }
    setFile(f);
    setError('');
    if (!name) setName(f.name.replace(/\.[^.]+$/, ''));
  }, [name]);

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndPick(f);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    const fd = new FormData();
    fd.append('file',     file);
    fd.append('name',     name.trim());
    fd.append('timeframe', timeframe);
    if (description.trim()) fd.append('description', description.trim());
    if (asset.trim())       fd.append('asset',       asset.trim());

    try {
      const { data } = await api.post<ImportResult>('/strategies/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && !!file && !!name.trim();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Importer une stratégie" subtitle="Analysez votre document PDF, TXT ou MD avec l'IA">
      <Head><title>Importer — Alvio</title></Head>

      {/* Back button */}
      <div style={{ marginBottom: '24px', marginTop: '-8px' }}>
        <button
          onClick={() => router.push('/strategies')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Mes stratégies
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : 'minmax(0,680px)', gap: '20px' }}>

        {/* ══ FORMULAIRE ══════════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Dropzone */}
          <div style={card}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
              Document à analyser
            </h2>
            <div
              role="button"
              tabIndex={0}
              aria-label="Zone de dépôt de fichier"
              onDrop={onDrop}
              onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
              style={{
                border:       `2px dashed ${isDragging ? '#2563eb' : file ? '#10b981' : '#d1d5db'}`,
                borderRadius: '12px',
                background:   isDragging ? '#eff6ff' : file ? '#f0fdf4' : '#f9fafb',
                padding:      '36px 24px',
                textAlign:    'center',
                cursor:       'pointer',
                transition:   'all 0.18s ease',
              }}
            >
              {file ? (
                <>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>📄</div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: '#10b981', margin: 0 }}>
                    {(file.size / 1024).toFixed(0)} Ko — cliquer pour changer
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '36px', marginBottom: '10px' }}>☁️</div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 4px' }}>
                    Glissez votre fichier ici ou{' '}
                    <span style={{ color: '#2563eb', textDecoration: 'underline' }}>parcourir</span>
                  </p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>PDF, TXT, MD — max 10 Mo</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) validateAndPick(f);
                e.target.value = '';
              }}
            />
          </div>

          {/* Métadonnées */}
          <div style={card}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>
              Informations de la stratégie
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Nom de la stratégie <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex : RSI + EMA Trend Following"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={input}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                  Description (optionnel)
                </label>
                <textarea
                  rows={2}
                  placeholder="Décrivez brièvement votre approche..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...input, resize: 'vertical', lineHeight: '1.6' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Timeframe
                  </label>
                  <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={input}>
                    {TIMEFRAMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: '6px' }}>
                    Actif (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="BTC/USDT"
                    value={asset}
                    onChange={(e) => setAsset(e.target.value)}
                    style={input}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Erreur */}
          {error && (
            <div style={{ background: '#fef2f2', borderRadius: '12px', padding: '14px 16px', border: '1.5px solid #fecaca', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: 600 }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              padding:        '14px',
              borderRadius:   '12px',
              border:         'none',
              background:     canSubmit ? '#2563eb' : '#93c5fd',
              color:          'white',
              fontSize:       '15px',
              fontWeight:     700,
              cursor:         canSubmit ? 'pointer' : 'not-allowed',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '10px',
              transition:     'background 0.15s',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.7s linear infinite' }} />
                Analyse en cours…
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analyser avec l'IA
              </>
            )}
          </button>

        </form>

        {/* ══ RÉSULTATS ═══════════════════════════════════════════════════════ */}
        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Succès */}
            <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '18px 22px', border: '1.5px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <svg width="20" height="20" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#065f46', margin: 0 }}>{result.message}</p>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 2px' }}>
                {result.strategy.asset} · {result.strategy.timeframe}
              </p>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, fontFamily: 'monospace' }}>
                ID : {result.strategy.id}
              </p>
            </div>

            {/* Conditions d'entrée — vert */}
            <RulesCard
              title="▲ Conditions d'entrée"
              items={result.rules.entry_conditions}
              accent="#10b981"
              bg="#f0fdf4"
              border="#bbf7d0"
              emptyLabel="Aucune condition d'entrée détectée."
            />

            {/* Conditions de sortie — rouge */}
            <RulesCard
              title="▼ Conditions de sortie"
              items={result.rules.exit_conditions}
              accent="#ef4444"
              bg="#fef2f2"
              border="#fecaca"
              emptyLabel="Aucune condition de sortie détectée."
            />

            {/* Indicateurs — bleu */}
            <RulesCard
              title="◆ Indicateurs détectés"
              items={result.rules.indicators}
              accent="#2563eb"
              bg="#eff6ff"
              border="#bfdbfe"
              emptyLabel="Aucun indicateur détecté."
            />

            {/* Gestion du risque — cards grises */}
            {result.rules.risk_management.length > 0 && (
              <div style={{ ...card, background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#374151', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚡ Gestion du risque
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.rules.risk_management.map((item, i) => (
                    <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '10px 14px', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '13px', color: '#374151', margin: 0, lineHeight: '1.5' }}>{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push('/strategies')}
              style={{ padding: '12px', borderRadius: '12px', border: 'none', background: '#2563eb', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginTop: '4px' }}
            >
              Voir mes stratégies →
            </button>

          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppLayout>
  );
};

export default ImportStrategyPage;
