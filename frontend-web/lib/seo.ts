export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://alvio.io';
export const SITE_NAME = 'Alvio';
export const TWITTER_HANDLE = '@AlvioTrading';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const DEFAULT_DESCRIPTION =
  'Alvio — Plateforme de trading algorithmique avec signaux IA. Analyse les marchés crypto en temps réel et génère des signaux BUY/SELL. Rejoignez 2 400+ traders.';

export interface PageSEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

export const PAGE_SEO: Record<string, Omit<PageSEOProps, 'noindex'>> = {
  home: {
    title: 'Alvio — Trading Algorithmique Intelligent',
    description:
      'Alvio — Plateforme de trading algorithmique. Signaux IA en temps réel, analyse des marchés crypto, backtesting et simulation de portefeuille. Rejoignez 2 400+ traders.',
    canonical: SITE_URL,
    ogImage: `${SITE_URL}/og-image.png`,
    ogType: 'website',
  },
  login: {
    title: 'Connexion — Alvio',
    description: 'Connectez-vous à Alvio. Accès à vos signaux de trading et stratégies algorithmiques personnalisées.',
    canonical: `${SITE_URL}/login`,
  },
  register: {
    title: 'Créer un compte — Alvio',
    description: 'Créez un compte Alvio. Rejoignez notre plateforme de trading intelligent avec signaux IA et analyses en temps réel.',
    canonical: `${SITE_URL}/register`,
  },
  pricing: {
    title: 'Tarifs — Alvio',
    description: 'Plans tarifaires Alvio. Choisissez l\'abonnement adapté à vos besoins de trading algorithmique. Essai gratuit disponible.',
    canonical: `${SITE_URL}/pricing`,
    ogImage: `${SITE_URL}/og-image.png`,
  },
  markets: {
    title: 'Marchés Crypto — Alvio',
    description: 'Marchés crypto Alvio. Analysez les prix, volumes et tendances avec nos indicateurs techniques avancés et signaux IA.',
    canonical: `${SITE_URL}/markets`,
    ogImage: `${SITE_URL}/og-markets.png`,
  },
  signals: {
    title: 'Signaux Trading — Alvio',
    description: 'Signaux de trading Alvio. Recommandations BUY/SELL générées par intelligence artificielle sur les marchés crypto.',
    canonical: `${SITE_URL}/signals`,
    ogImage: `${SITE_URL}/og-signals.png`,
  },
  formation: {
    title: 'Formation Trading — Alvio',
    description: 'Formation trading Alvio. Apprenez les stratégies algorithmiques et l\'analyse technique avec des cours structurés et des exercices pratiques.',
    canonical: `${SITE_URL}/formation`,
    ogImage: `${SITE_URL}/og-formation.png`,
  },
  dashboard: {
    title: 'Dashboard — Alvio',
    description: 'Tableau de bord Alvio. Suivez vos performances de trading, vos positions et vos signaux actifs.',
    canonical: `${SITE_URL}/dashboard`,
  },
  reports: {
    title: 'Rapports — Alvio',
    description: 'Rapports de trading Alvio. Analyse de performance et statistiques de vos stratégies algorithmiques.',
    canonical: `${SITE_URL}/reports`,
  },
  profile: {
    title: 'Mon Profil — Alvio',
    description: 'Profil utilisateur Alvio. Gestion de compte et préférences personnalisées.',
    canonical: `${SITE_URL}/profile`,
  },
  simulator: {
    title: 'Simulateur DCA — Alvio',
    description: 'Simulateur de trading Alvio. Testez vos stratégies DCA et analysez vos performances sur données historiques.',
    canonical: `${SITE_URL}/simulator`,
  },
  strategies: {
    title: 'Stratégies — Alvio',
    description: 'Stratégies de trading Alvio. Créez et gérez vos stratégies algorithmiques personnalisées.',
    canonical: `${SITE_URL}/strategies`,
  },
};

export const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Alvio',
  description: 'Plateforme de trading algorithmique avec signaux IA',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  sameAs: [
    'https://twitter.com/AlvioTrading',
    'https://linkedin.com/company/alvio',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Support',
    email: 'support@alvio.io',
  },
};

export const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alvio',
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/markets?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

export const FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Comment fonctionnent les signaux IA d\'Alvio ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alvio analyse en temps réel les données de marché crypto et utilise des modèles d\'intelligence artificielle pour détecter plus de 15 patterns chartistes et générer des signaux BUY/SELL avec un score de confiance.',
      },
    },
    {
      '@type': 'Question',
      name: 'Alvio est-il gratuit ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alvio propose un plan Starter gratuit avec 3 signaux par jour. Des plans Pro et Elite sont disponibles avec des fonctionnalités avancées.',
      },
    },
    {
      '@type': 'Question',
      name: 'Sur quels marchés crypto Alvio génère-t-il des signaux ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Alvio couvre les principales paires crypto : BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT et plus de 50 autres cryptomonnaies.',
      },
    },
  ],
};

export const PRICING_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Alvio Trading Platform',
  description: 'Plateforme de trading algorithmique avec signaux IA en temps réel',
  url: `${SITE_URL}/pricing`,
  brand: {
    '@type': 'Brand',
    name: 'Alvio',
  },
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '0',
      priceCurrency: 'EUR',
      description: '3 signaux par jour, dashboard basique',
      url: `${SITE_URL}/register`,
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '29',
      priceCurrency: 'EUR',
      description: 'Signaux illimités, patterns avancés, alertes Telegram',
      url: `${SITE_URL}/register`,
    },
    {
      '@type': 'Offer',
      name: 'Elite',
      price: '79',
      priceCurrency: 'EUR',
      description: 'Accès complet, API, formation premium, support prioritaire',
      url: `${SITE_URL}/register`,
    },
  ],
};
