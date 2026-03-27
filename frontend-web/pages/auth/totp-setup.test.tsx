/**
 * Tests Vitest — Page TotpSetupPage
 * Couvre : rendu initial, flow scan → confirm, erreurs, succès
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('next/router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// Mock de l'API TOTP
vi.mock('@/api', () => ({
  totpApi: {
    enrollInit: vi.fn(),
    enrollConfirm: vi.fn(),
  },
}));

import { totpApi } from '@/api';
import TotpSetupPage from './totp-setup';

const mockEnrollInit    = vi.mocked(totpApi.enrollInit);
const mockEnrollConfirm = vi.mocked(totpApi.enrollConfirm);

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TotpSetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le spinner pendant le chargement', () => {
    mockEnrollInit.mockReturnValue(new Promise(() => {})); // Never resolves
    render(<TotpSetupPage />);
    expect(screen.getByText(/génération du qr code/i)).toBeDefined();
  });

  it('affiche le QR code après chargement réussi', async () => {
    mockEnrollInit.mockResolvedValue({
      data: {
        qrCodeDataUrl: 'data:image/png;base64,abc123',
        secret:        'JBSWY3DPEHPK3PXP',
      },
    } as never);

    render(<TotpSetupPage />);

    await waitFor(() => {
      expect(screen.getByAltText(/qr code totp/i)).toBeDefined();
    });
    expect(screen.getByRole('button', { name: /scanné/i })).toBeDefined();
  });

  it('affiche le formulaire de confirmation après clic "J\'ai scanné"', async () => {
    mockEnrollInit.mockResolvedValue({
      data: { qrCodeDataUrl: 'data:image/png;base64,abc', secret: 'SECRET123' },
    } as never);

    render(<TotpSetupPage />);

    await waitFor(() => screen.getByRole('button', { name: /scanné/i }));
    fireEvent.click(screen.getByRole('button', { name: /scanné/i }));

    expect(screen.getByPlaceholderText('000000')).toBeDefined();
    expect(screen.getByRole('button', { name: /activer totp/i })).toBeDefined();
  });

  it('désactive le bouton confirm si le code n\'est pas 6 chiffres', async () => {
    mockEnrollInit.mockResolvedValue({
      data: { qrCodeDataUrl: 'data:image/png;base64,x', secret: 'S' },
    } as never);

    render(<TotpSetupPage />);
    await waitFor(() => screen.getByRole('button', { name: /scanné/i }));
    fireEvent.click(screen.getByRole('button', { name: /scanné/i }));

    const input = screen.getByPlaceholderText('000000');
    const btn   = screen.getByRole('button', { name: /activer totp/i });

    fireEvent.change(input, { target: { value: '123' } });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('affiche le succès après enrollConfirm réussi', async () => {
    mockEnrollInit.mockResolvedValue({
      data: { qrCodeDataUrl: 'data:image/png;base64,x', secret: 'S' },
    } as never);
    mockEnrollConfirm.mockResolvedValue({} as never);

    render(<TotpSetupPage />);
    await waitFor(() => screen.getByRole('button', { name: /scanné/i }));
    fireEvent.click(screen.getByRole('button', { name: /scanné/i }));

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /activer totp/i }));

    await waitFor(() => {
      expect(screen.getByText(/totp activé/i)).toBeDefined();
    });
  });

  it('affiche une erreur si enrollConfirm échoue', async () => {
    mockEnrollInit.mockResolvedValue({
      data: { qrCodeDataUrl: 'data:image/png;base64,x', secret: 'S' },
    } as never);
    mockEnrollConfirm.mockRejectedValue({
      response: { data: { message: 'Code TOTP invalide' } },
    });

    render(<TotpSetupPage />);
    await waitFor(() => screen.getByRole('button', { name: /scanné/i }));
    fireEvent.click(screen.getByRole('button', { name: /scanné/i }));

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /activer totp/i }));

    await waitFor(() => {
      expect(screen.getByText(/code totp invalide/i)).toBeDefined();
    });
  });

  it('affiche une erreur si enrollInit échoue', async () => {
    mockEnrollInit.mockRejectedValue({
      response: { data: { message: 'TOTP déjà activé sur ce compte' } },
    });

    render(<TotpSetupPage />);

    await waitFor(() => {
      expect(screen.getByText(/totp déjà activé/i)).toBeDefined();
    });
  });
});
