import { useState } from 'react';

export default function GovernanceTab({ isFr }) {
  const [openSection, setOpenSection] = useState(null);

  const sections = [
    {
      key: 'mission',
      icon: '🌍',
      title: isFr ? 'Mission et Objectifs' : 'Mission & Objectives',
      content: isFr
        ? "Sahel AgriConnect a pour mission de digitaliser et souverainiser l'agriculture africaine. La plateforme connecte les producteurs, les coopératives, les investisseurs diaspora et les acheteurs internationaux dans un écosystème transparent, équitable et centré sur les données africaines."
        : "Sahel AgriConnect's mission is to digitize and empower African agriculture. The platform connects producers, cooperatives, diaspora investors, and international buyers in a transparent, equitable ecosystem centered on African data sovereignty.",
    },
    {
      key: 'cooperative_rights',
      icon: '🤝',
      title: isFr ? 'Droits des Coopératives' : 'Cooperative Rights',
      content: null,
      bullets: isFr
        ? [
            'Chaque coopérative est propriétaire de ses données membres — la plateforme est un outil de gestion, non un propriétaire de données',
            'Les coopératives peuvent demander l\'accès à leurs données complètes à tout moment',
            'Les données de production, de vente et de membres ne sont jamais partagées sans consentement explicite',
            'Les coopératives ont le droit de se retirer de la plateforme avec exportation complète de leurs données sous 30 jours',
            'Les décisions affectant les coopératives membres doivent être communiquées avec 30 jours de préavis',
            'Chaque coopérative a accès à un espace de gestion dédié avec visibilité sur ses agriculteurs, ses équipements, ses certifications et ses performances',
          ]
        : [
            'Each cooperative owns its member data — the platform is a management tool, not a data owner',
            'Cooperatives can request full access to their data at any time',
            'Production, sales, and member data are never shared without explicit consent',
            'Cooperatives have the right to leave the platform with full data export within 30 days',
            'Decisions affecting member cooperatives must be communicated with 30 days notice',
            'Each cooperative has a dedicated management space with visibility over their farmers, equipment, certifications, and performance',
          ],
    },
    {
      key: 'farmer_rights',
      icon: '👩‍🌾',
      title: isFr ? 'Droits des Agriculteurs' : 'Farmer Rights',
      bullets: isFr
        ? [
            'Les agriculteurs sont propriétaires de leurs données personnelles et agricoles',
            "L'inscription est gratuite et ne crée aucune obligation financière",
            'Les données de localisation GPS sont utilisées uniquement pour la vérification et l\'analyse régionale — jamais commercialisées',
            'Les résultats des diagnostics IA (sol, maladies) appartiennent à l\'agriculteur et ne sont pas partagés sans autorisation',
            'Un agriculteur peut quitter la plateforme et supprimer son profil à tout moment',
            'Les agriculteurs membres d\'une coopérative ont accès aux mêmes avantages et programmes que leur coopérative',
          ]
        : [
            'Farmers own their personal and agricultural data',
            'Registration is free and creates no financial obligation',
            'GPS location data is used only for verification and regional analysis — never sold',
            'AI diagnostic results (soil, disease) belong to the farmer and are not shared without permission',
            'A farmer can leave the platform and delete their profile at any time',
            'Farmers who are cooperative members have access to the same benefits and programs as their cooperative',
          ],
    },
    {
      key: 'admin_responsibilities',
      icon: '⚙️',
      title: isFr ? 'Responsabilités de l\'Administration' : 'Admin Responsibilities',
      bullets: isFr
        ? [
            'L\'admin central coordonne toutes les demandes de formation, certification, équipement et investissement',
            'Chaque demande d\'avantage doit être traitée dans les 48 heures ouvrables',
            'L\'admin facilite les connexions entre investisseurs diaspora et coopératives via AfriYield Exchange',
            'Les licences pays sont gérées par l\'admin central avec isolation complète des données par pays',
            'Les admins pays ne peuvent accéder qu\'aux données de leur territoire — aucun accès croisé',
            'L\'admin est responsable de la vérification de toutes les certifications avant activation',
            'Toute décision de rejet de demande doit être accompagnée d\'une explication écrite',
          ]
        : [
            'Central admin coordinates all training, certification, equipment, and investment requests',
            'Each benefit request must be processed within 48 working hours',
            'Admin facilitates connections between diaspora investors and cooperatives via AfriYield Exchange',
            'Country licenses are managed by central admin with complete data isolation per country',
            'Country admins can only access data from their territory — no cross-access',
            'Admin is responsible for verifying all certifications before activation',
            'Any rejection decision must be accompanied by a written explanation',
          ],
    },
    {
      key: 'data_sovereignty',
      icon: '🔒',
      title: isFr ? 'Souveraineté des Données' : 'Data Sovereignty',
      bullets: isFr
        ? [
            'Les données africaines restent hébergées sur des serveurs conformes aux réglementations locales',
            'Aucune donnée personnelle n\'est vendue à des tiers, annonceurs ou gouvernements étrangers',
            'Les données agrégées anonymisées peuvent être utilisées pour des rapports d\'impact et des études de développement',
            'Chaque pays licensié dispose d\'un environnement de données isolé — les données nationales ne transitent pas vers d\'autres pays',
            'Les données d\'investissement AfriYield sont chiffrées et accessibles uniquement aux parties concernées',
            'La politique de rétention des données financières est de 7 ans conformément aux obligations légales',
          ]
        : [
            'African data remains hosted on servers compliant with local regulations',
            'No personal data is sold to third parties, advertisers, or foreign governments',
            'Anonymized aggregate data may be used for impact reports and development studies',
            'Each licensed country has an isolated data environment — national data does not flow to other countries',
            'AfriYield investment data is encrypted and accessible only to the relevant parties',
            'Financial data retention policy is 7 years in compliance with legal obligations',
          ],
    },
    {
      key: 'dispute',
      icon: '⚖️',
      title: isFr ? 'Résolution des Conflits' : 'Dispute Resolution',
      content: isFr
        ? 'Tout différend entre une coopérative et la plateforme est d\'abord soumis à une médiation directe via email à info@djiguicorporation.org. Si non résolu en 30 jours, les parties peuvent faire appel à un médiateur indépendant agréé. Les litiges financiers liés à AfriYield Exchange suivent les termes du contrat d\'investissement signé. Aucune action légale ne peut être initiée sans médiation préalable.'
        : 'Any dispute between a cooperative and the platform is first submitted to direct mediation via email at info@djiguicorporation.org. If unresolved within 30 days, parties may call on an accredited independent mediator. Financial disputes related to AfriYield Exchange follow the terms of the signed investment agreement. No legal action may be initiated without prior mediation.',
    },
    {
      key: 'fees',
      icon: '💰',
      title: isFr ? 'Structure des Frais et Transparence Financière' : 'Fee Structure & Financial Transparency',
      bullets: isFr
        ? [
            'Adhésion coopérative: 199$/an — donne accès à tous les outils de gestion, certifications et programmes',
            'Certification export: 299$ individuel / 499$ coopérative — frais uniques de traitement',
            'Licence pays: 999$/mois — accès administrateur dédié avec isolation des données',
            'AfriYield facilitation: 5% du capital déployé — frais unique à l\'investissement',
            'Premium investisseur: 29,99$/mois ou 299$/an — accès aux alertes et rapports exclusifs',
            'Formations: 99–299$ par session selon le niveau et la certification associée',
            'Aucun frais caché. Aucune commission sur les revenus des agriculteurs ou coopératives.',
          ]
        : [
            'Cooperative membership: $199/year — access to all management tools, certifications, and programs',
            'Export certification: $299 individual / $499 cooperative — one-time processing fee',
            'Country license: $999/month — dedicated admin access with data isolation',
            'AfriYield facilitation: 5% of capital deployed — one-time at investment',
            'Investor Premium: $29.99/month or $299/year — access to alerts and exclusive reports',
            'Training: $99–$299 per session depending on level and associated certification',
            'No hidden fees. No commission on farmer or cooperative revenue.',
          ],
    },
  ];

  return (
    <div className="p-4 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-brand-forest">
          {isFr ? 'Gouvernance de la Plateforme' : 'Platform Governance'}
        </h2>
        <p className="text-gray-500 text-sm">
          {isFr
            ? 'Règles, droits et responsabilités qui régissent Sahel AgriConnect et AfriYield Exchange'
            : 'Rules, rights, and responsibilities governing Sahel AgriConnect and AfriYield Exchange'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: '🤝',
            label: isFr ? 'Coopératives' : 'Cooperatives',
            sub: isFr ? 'Propriétaires de leurs données' : 'Own their data',
          },
          {
            icon: '👩‍🌾',
            label: isFr ? 'Agriculteurs' : 'Farmers',
            sub: isFr ? 'Inscription gratuite toujours' : 'Always free to join',
          },
          {
            icon: '🔒',
            label: isFr ? 'Données' : 'Data',
            sub: isFr ? 'Souveraineté africaine' : 'African sovereignty',
          },
          {
            icon: '⚖️',
            label: isFr ? 'Litiges' : 'Disputes',
            sub: isFr ? "Médiation d'abord" : 'Mediation first',
          },
        ].map((c) => (
          <div
            key={c.label}
            className="bg-[#1a3c2e]/5 rounded-xl p-3 text-center border border-[#1a3c2e]/10"
          >
            <span className="text-2xl">{c.icon}</span>
            <p className="text-xs font-bold text-brand-forest mt-1">{c.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sections.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === s.key ? null : s.key)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition"
            >
              <span className="flex items-center gap-3 font-semibold text-brand-forest">
                <span className="text-xl">{s.icon}</span>
                {s.title}
              </span>
              <span className="text-gray-400">{openSection === s.key ? '▲' : '▼'}</span>
            </button>
            {openSection === s.key && (
              <div className="px-5 pb-5">
                {s.content ? (
                  <p className="text-gray-600 text-sm leading-relaxed">{s.content}</p>
                ) : null}
                {s.bullets ? (
                  <ul className="space-y-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-brand-forest mt-0.5 flex-shrink-0">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#1a3c2e] text-white rounded-2xl p-5">
        <p className="font-bold mb-1">{isFr ? 'Questions de gouvernance' : 'Governance Questions'}</p>
        <p className="text-white/70 text-sm mb-3">
          {isFr
            ? 'Pour toute question relative à la gouvernance, aux droits ou aux responsabilités:'
            : 'For any questions about governance, rights, or responsibilities:'}
        </p>
        <a
          href="mailto:info@djiguicorporation.org?subject=Gouvernance — Sahel AgriConnect"
          className="inline-flex items-center gap-2 bg-[#B5850A] text-[#1a3c2e] px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#9a7109] transition"
        >
          📧 info@djiguicorporation.org
        </a>
      </div>
    </div>
  );
}
