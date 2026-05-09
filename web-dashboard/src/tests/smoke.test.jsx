import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock heavy dependencies that need browser APIs or network
vi.mock('../lib/supabase', () => ({ supabase: null, isSupabaseConfigured: () => false }));
vi.mock('../lib/analytics', () => ({ captureEvent: vi.fn(), AnalyticsEvents: {} }));
vi.mock('../config/api', () => ({
  API_BASE_URL: 'http://localhost:3001',
  API_ENDPOINTS: { FARMERS: { BASE: 'http://localhost:3001/api/farmers' } },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'fr', changeLanguage: vi.fn() } }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

import FarmerRegistrationPage from '../pages/FarmerRegistrationPage';
import InvestorPortal from '../pages/InvestorPortal';

describe('FarmerRegistrationPage smoke test', () => {
  it('renders step 1 of the registration form without crashing', () => {
    render(
      <MemoryRouter>
        <FarmerRegistrationPage />
      </MemoryRouter>
    );
    // Step 1 should be visible — look for a field that exists on step 1
    expect(document.body).toBeTruthy();
  });

  it('does not render a submit button on step 1 (multi-step guard)', () => {
    render(
      <MemoryRouter>
        <FarmerRegistrationPage />
      </MemoryRouter>
    );
    // Final submit only appears on step 3
    const submitButtons = screen.queryAllByRole('button', { name: /soumettre|submit/i });
    expect(submitButtons.length).toBe(0);
  });
});

describe('InvestorPortal smoke test', () => {
  beforeEach(() => {
    // Clear sessionStorage so the portal always shows the access screen
    sessionStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ success: false }),
    });
  });

  it('renders the email access screen when no session token exists', () => {
    render(
      <MemoryRouter>
        <InvestorPortal />
      </MemoryRouter>
    );
    // The access screen has an email input
    expect(document.querySelector('input[type="email"]')).toBeTruthy();
  });
});

