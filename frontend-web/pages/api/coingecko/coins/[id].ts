import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import axios from 'axios';
import * as cache from '../../../../utils/serverCache';

const agent = new https.Agent({ rejectUnauthorized: false });
const BASE = 'https://api.coingecko.com/api/v3';
const TTL = 60_000; // 60 s

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (typeof id !== 'string') return res.status(400).json({ error: 'id invalide' });

  const key = `coin:${id}`;
  const fresh = cache.get(key);
  if (fresh) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(fresh);
  }

  try {
    const { data } = await axios.get(`${BASE}/coins/${id}`, {
      params: {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
      },
      httpsAgent: agent,
      timeout: 10_000,
    });
    cache.set(key, data, TTL);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? 502) : 502;

    if (status === 429) {
      const stale = cache.getStale(key);
      if (stale) {
        res.setHeader('X-Cache', 'STALE');
        return res.status(200).json(stale);
      }
    }

    const message = axios.isAxiosError(err) ? err.message : 'Impossible de joindre CoinGecko';
    return res.status(status).json({ error: message });
  }
}
