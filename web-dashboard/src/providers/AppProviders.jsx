import { HelmetProvider } from 'react-helmet-async';
import { Analytics } from '@vercel/analytics/react';
import { PostHogProvider } from 'posthog-js/react';
import { posthog } from '../lib/analytics';

export default function AppProviders({ children }) {
  const hasPosthog = Boolean(import.meta.env.VITE_POSTHOG_KEY);

  const inner = (
    <>
      {children}
      <Analytics />
    </>
  );

  return (
    <HelmetProvider>
      {hasPosthog ? <PostHogProvider client={posthog}>{inner}</PostHogProvider> : inner}
    </HelmetProvider>
  );
}
