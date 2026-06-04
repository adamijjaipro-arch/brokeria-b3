import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import axios from 'axios';
import * as cache from '../../../utils/serverCache';

const agent = new https.Agent({ rejectUnauthorized: false });
const URL = 'https://api.coingecko.com/api/v3/coins/markets';
const KEY = 'markets';
const TTL = 60_000; // 60 s

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const fresh = cache.get(KEY);
  if (fresh) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(fresh);
  }

  try {
    const { data } = await axios.get(URL, {
      params: { vs_currency: 'usd', order: 'market_cap_desc', per_page: 20, sparkline: true },
      httpsAgent: agent,
      timeout: 10_000,
    });
    cache.set(KEY, data, TTL);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 502) : 502;

    // On 429 : renvoyer les données périmées si dispo
    if (status === 429) {
      const stale = cache.getStale(KEY);
      if (stale) {
        res.setHeader('X-Cache', 'STALE');
        return res.status(200).json(stale);
      }
    }

    const message = axios.isAxiosError(err) ? err.message : 'Impossible de joindre CoinGecko';
    return res.status(status).json({ error: message });
  }
}
