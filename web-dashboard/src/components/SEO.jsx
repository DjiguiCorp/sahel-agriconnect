import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://sahel-agriconnect.vercel.app';
const DEFAULT_TITLE = "Sahel AgriConnect — Digitalisation de l'agriculture en Afrique de l'Ouest et au-delà";
const DEFAULT_DESCRIPTION =
  "Plateforme numérique connectant les agriculteurs d'Afrique de l'Ouest et au-delà aux marchés, coopératives et services agricoles.";

/**
 * Métadonnées SEO par défaut (SPA Vite — pas de SSR ; balises complètes pour crawlers et partages).
 */
export default function SEO({ title, description, path = '' }) {
  const pageTitle = title ? `${title} | Sahel AgriConnect` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;
  const url = `${SITE_URL}${path.startsWith('/') ? path : path ? `/${path}` : ''}`;

  return (
    <Helmet htmlAttributes={{ lang: 'fr' }}>
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={`${SITE_URL}/og-image.png`} />
      <meta property="og:locale" content="fr_FR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.png`} />

      <meta name="theme-color" content="#1B4332" />
    </Helmet>
  );
}
