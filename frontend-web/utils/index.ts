// ─── Formatage ────────────────────────────────────────────────────────────────

/** Formate un nombre en devise (USD par défaut) */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
}

/** Formate un pourcentage avec N décimales */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Formate une date ISO en date locale lisible */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Formate une date ISO en date + heure locale */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Calculs financiers ───────────────────────────────────────────────────────

/** Calcule le ratio risque/rendement */
export function calcRiskReward(entry: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);
  if (risk === 0) return 0;
  return parseFloat((reward / risk).toFixed(2));
}

/** Calcule le ROI en pourcentage */
export function calcROI(initial: number, final: number): number {
  if (initial === 0) return 0;
  return parseFloat((((final - initial) / initial) * 100).toFixed(2));
}

// ─── Utilitaires généraux ────────────────────────────────────────────────────

/** Tronque un texte à N caractères avec ellipse */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

/** Attend N millisecondes (utile pour les tests ou les délais UI) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retourne true si l'on est côté client (navigateur) */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}
