import { Injectable, Logger } from '@nestjs/common';
import * as nm from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface SignalEmailPayload {
  asset: string;
  direction: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  takeProfit: number;
  tp2?: number | null;
  stopLoss: number;
  confidence: number;
  pattern?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    const port = Number(process.env.SMTP_PORT) || 465;
    this.transporter = (nm as any).createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      family: 4,
      tls: { rejectUnauthorized: false },
    } as any);
  }

  // ─── Magic Link ─────────────────────────────────────────────────────────────

  async sendMagicLink(to: string, link: string): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(`SMTP non configuré — Magic Link pour ${to}: ${link}`);
      return;
    }

    const html = `
<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#060b14,#0a1628);padding:32px;text-align:center;">
            <div style="width:48px;height:48px;background:#2563eb;border-radius:12px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:24px;">✉</span>
            </div>
            <h1 style="color:white;font-size:22px;font-weight:700;margin:0;">Votre lien de connexion</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;text-align:center;">
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Cliquez sur le bouton ci-dessous pour vous connecter.<br>
              Ce lien expire dans <strong>15 minutes</strong> et ne peut être utilisé qu'une seule fois.
            </p>
            <a href="${link}" style="display:inline-block;background:#2563eb;color:white;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">
              Se connecter →
            </a>
            <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;word-break:break-all;">
              Ou copiez ce lien : <span style="color:#2563eb;">${link}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
              Si vous n'avez pas demandé ce lien, ignorez cet email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
      await this.transporter.sendMail({
        from: `"BrokerIA" <${process.env.SMTP_USER}>`,
        to,
        subject: '🔐 Votre lien de connexion BrokerIA',
        html,
      });
      this.logger.log(`Magic link envoyé à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi magic link à ${to}: ${(err as Error).message}`);
    }
  }

  // ─── OTP / 2FA ──────────────────────────────────────────────────────────────

  async sendOTP(to: string, code: string): Promise<void> {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(`SMTP non configuré — OTP pour ${to}: ${code}`);
      return;
    }

    const html = `
<!DOCTYPE html><html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#060b14,#0a1628);padding:32px;text-align:center;">
            <h1 style="color:white;font-size:22px;font-weight:700;margin:0;">Code de vérification</h1>
            <p style="color:#94a3b8;font-size:14px;margin:8px 0 0;">Double authentification BrokerIA</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 32px;text-align:center;">
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
              Utilisez le code ci-dessous pour finaliser votre connexion.<br>
              Ce code expire dans <strong>10 minutes</strong>.
            </p>
            <div style="display:inline-block;background:#f0f7ff;border:2px solid #2563eb;border-radius:16px;padding:20px 48px;margin-bottom:24px;">
              <span style="font-size:40px;font-weight:900;color:#2563eb;letter-spacing:12px;">${code}</span>
            </div>
            <p style="color:#9ca3af;font-size:13px;margin:0;">
              Si vous n'avez pas demandé ce code, ignorez cet email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">BrokerIA — Sécurité de votre compte</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    try {
      await this.transporter.sendMail({
        from: `"BrokerIA" <${process.env.SMTP_USER}>`,
        to,
        subject: '🔐 Votre code de vérification BrokerIA',
        html,
      });
      this.logger.log(`OTP envoyé à ${to}`);
    } catch (err) {
      this.logger.error(`Échec envoi OTP à ${to}: ${(err as Error).message}`);
    }
  }

  // ─── Signal notification ─────────────────────────────────────────────────────

  async sendSignalNotification(
    recipients: string[],
    signal: SignalEmailPayload,
  ): Promise<void> {
    if (!recipients.length) return;
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn('SMTP not configured — skipping email notifications');
      return;
    }

    const dirColor =
      signal.direction === 'BUY'
        ? '#10b981'
        : signal.direction === 'SELL'
        ? '#ef4444'
        : '#f59e0b';

    const dirLabel =
      signal.direction === 'BUY' ? '🟢 BUY' : signal.direction === 'SELL' ? '🔴 SELL' : '🟡 HOLD';

    const isCrypto = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].some((c) =>
      signal.asset.toUpperCase().includes(c),
    );
    const prefix = isCrypto ? '$' : '';
    const fmt = (n: number) => prefix + n.toLocaleString('fr-FR', { maximumFractionDigits: n >= 1000 ? 0 : 4 });

    const tp2Row = signal.tp2
      ? `<tr>
           <td style="padding:10px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f1f5f9;">TP 2</td>
           <td style="padding:10px 16px;font-weight:700;color:#059669;font-size:14px;border-bottom:1px solid #f1f5f9;">${fmt(signal.tp2)}</td>
         </tr>`
      : '';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#060b14 0%,#0a1628 100%);padding:28px 32px;border-radius:16px 16px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="display:inline-flex;align-items:center;gap:8px;">
                    <div style="width:32px;height:32px;background:#2563eb;border-radius:8px;display:inline-block;vertical-align:middle;text-align:center;line-height:32px;">
                      <span style="color:white;font-size:16px;font-weight:700;">B</span>
                    </div>
                    <span style="color:white;font-size:18px;font-weight:700;vertical-align:middle;margin-left:8px;">BrokerIA</span>
                  </div>
                </td>
                <td align="right">
                  <span style="background:rgba(16,185,129,0.15);color:#6ee7b7;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;border:1px solid rgba(16,185,129,0.3);">
                    ● Signal en direct
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Signal hero -->
        <tr>
          <td style="background:#0d1117;padding:28px 32px;">
            <p style="color:#94a3b8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Nouveau signal IA</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="font-size:28px;font-weight:800;color:white;">${signal.asset}</span>
                </td>
                <td align="right">
                  <span style="background:${dirColor};color:white;font-size:14px;font-weight:700;padding:6px 18px;border-radius:8px;">${dirLabel}</span>
                </td>
              </tr>
            </table>
            <div style="margin-top:12px;background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 14px;display:inline-block;">
              <span style="color:#94a3b8;font-size:13px;">Confiance IA : </span>
              <span style="color:${signal.confidence >= 85 ? '#10b981' : '#60a5fa'};font-weight:700;font-size:13px;">${signal.confidence}%</span>
              ${signal.pattern ? `<span style="color:#475569;font-size:13px;margin-left:12px;">· ${signal.pattern}</span>` : ''}
            </div>
          </td>
        </tr>

        <!-- Price table -->
        <tr>
          <td style="background:white;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr style="background:#f8fafc;">
                <td style="padding:10px 16px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Niveau</td>
                <td style="padding:10px 16px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Prix</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f1f5f9;">Entrée</td>
                <td style="padding:12px 16px;font-weight:700;color:#111827;font-size:15px;border-bottom:1px solid #f1f5f9;">${fmt(signal.entryPrice)}</td>
              </tr>
              <tr>
                <td style="padding:10px 16px;color:#6b7280;font-size:13px;border-bottom:1px solid #f1f5f9;">${signal.tp2 ? 'TP 1' : 'Take Profit'}</td>
                <td style="padding:10px 16px;font-weight:700;color:#10b981;font-size:14px;border-bottom:1px solid #f1f5f9;">${fmt(signal.takeProfit)}</td>
              </tr>
              ${tp2Row}
              <tr>
                <td style="padding:10px 16px;color:#6b7280;font-size:13px;">Stop Loss</td>
                <td style="padding:10px 16px;font-weight:700;color:#ef4444;font-size:14px;">${fmt(signal.stopLoss)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="background:white;padding:20px 32px 28px;border-bottom:1px solid #e5e7eb;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3006'}/signals"
               style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">
              Voir le signal complet →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
            <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.6;">
              Vous recevez cet email car vous êtes inscrit sur BrokerIA.<br>
              Les signaux sont générés par IA à titre informatif et ne constituent pas des conseils financiers.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send to all recipients (batch of 50 BCC max to avoid spam filters)
    const chunkSize = 50;
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize);
      try {
        await this.transporter.sendMail({
          from: `"BrokerIA Signaux" <${process.env.SMTP_USER}>`,
          bcc: chunk,
          subject: `🚀 Nouveau Signal ${signal.direction} — ${signal.asset} | BrokerIA`,
          html,
        });
        this.logger.log(`Signal email sent to ${chunk.length} user(s)`);
      } catch (err) {
        this.logger.error(`Failed to send signal email: ${(err as Error).message}`);
      }
    }
  }
}
