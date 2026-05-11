import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2, Users, Globe, Building2, Handshake } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

export default function ImpactReport() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';

  const [stats, setStats] = useState({
    farmers: null,
    cooperatives: null,
    processors: null,
    loading: true,
  });

  useEffect(() => {
    Promise.allSettled([
      fetch(`${API}/api/farmers/public-stats`).then(r => r.json()),
      fetch(`${API}/api/cooperatives/public-stats`).then(r => r.json()),
      fetch(`${API}/api/processors/public-stats`).then(r => r.json()),
    ]).then(([f, c, p]) => {
      setStats({
        farmers: f.status === 'fulfilled' ? f.value : null,
        cooperatives: c.status === 'fulfilled' ? c.value : null,
        processors: p.status === 'fulfilled' ? p.value : null,
        loading: false,
      });
    });
  }, []);

  const metricCards = [
    {
      icon: <Users className="w-7 h-7" />,
      value: stats.loading ? null : (stats.farmers?.total ?? 0),
      label: isFr ? 'Agriculteurs enregistrés' : 'Registered Farmers',
      sub: isFr
        ? `${stats.farmers?.active ?? 0} actifs · ${(stats.farmers?.totalArea ?? 0).toFixed(1)} ha`
        : `${stats.farmers?.active ?? 0} active · ${(stats.farmers?.totalArea ?? 0).toFixed(1)} ha`,
      color: 'from-[#1a3c2e] to-[#2d5a3d]',
      textColor: 'text-white',
    },
    {
      icon: <Handshake className="w-7 h-7" />,
      value: stats.loading ? null : (stats.cooperatives?.total ?? 0),
      label: isFr ? 'Coopératives inscrites' : 'Registered Cooperatives',
      sub: isFr
        ? `${stats.cooperatives?.active ?? 0} actives · ${stats.cooperatives?.totalMembers ?? 0} membres`
        : `${stats.cooperatives?.active ?? 0} active · ${stats.cooperatives?.totalMembers ?? 0} members`,
      color: 'from-[#B5850A] to-[#9a7109]',
      textColor: 'text-white',
    },
    {
      icon: <Building2 className="w-7 h-7" />,
      value: stats.loading ? null : (stats.processors?.total ?? 0),
      label: isFr ? 'Centres de transformation' : 'Transformation Centers',
      sub: isFr
        ? `${stats.processors?.certified ?? 0} certifiés`
        : `${stats.processors?.certified ?? 0} certified`,
      color: 'from-[#3b82f6] to-[#2563eb]',
      textColor: 'text-white',
    },
    {
      icon: <Globe className="w-7 h-7" />,
      value: stats.loading ? null : (stats.farmers?.byCountry?.length ?? 0),
      label: isFr ? 'Pays représentés' : 'Countries Represented',
      sub: isFr ? 'Afrique sub-saharienne' : 'Sub-Saharan Africa',
      color: 'from-[#059669] to-[#047857]',
      textColor: 'text-white',
    },
  ];

  const sdgCards = [
    {
      n: 1, color: 'bg-red-600',
      label: isFr ? 'Pas de pauvreté' : 'No Poverty',
      text: isFr
        ? 'Connecter les petits agriculteurs aux marchés internationaux augmente le revenu des ménages et réduit la dépendance à l\'agriculture de subsistance.'
        : 'Connecting smallholder farmers to international markets increases household income and reduces dependency on subsistence agriculture.',
    },
    {
      n: 2, color: 'bg-yellow-500',
      label: isFr ? 'Faim zéro' : 'Zero Hunger',
      text: isFr
        ? 'Le diagnostic des sols, la détection des maladies et les outils d\'optimisation de la production aident les agriculteurs à augmenter leurs rendements et la sécurité alimentaire.'
        : 'Soil diagnosis, disease detection, and production optimization tools help farmers increase yields and food security.',
    },
    {
      n: 8, color: 'bg-purple-600',
      label: isFr ? 'Travail décent' : 'Decent Work',
      text: isFr
        ? 'La certification, l\'adhésion aux coopératives et l\'accès à l\'export créent des opportunités économiques formelles pour les producteurs ruraux.'
        : 'Certification, cooperative membership, and export access create formal economic opportunities for rural producers.',
    },
    {
      n: 17, color: 'bg-blue-600',
      label: isFr ? 'Partenariats' : 'Partnerships',
      text: isFr
        ? 'Plateforme multi-parties prenantes connectant gouvernements, ONG, investisseurs diaspora et acheteurs internationaux autour de la souveraineté alimentaire africaine.'
        : 'Multi-stakeholder platform connecting governments, NGOs, diaspora investors, and international buyers around African food sovereignty.',
    },
  ];

  const tocStages = [
    {
      label: isFr ? 'Intrants' : 'Inputs',
      text: isFr ? 'Inscription agriculteurs, outils IA, adhésion coopérative' : 'Farmer registration, AI tools, cooperative membership',
      border: 'border-t-[#1a3c2e]', dot: 'bg-[#1a3c2e]',
    },
    {
      label: isFr ? 'Activités' : 'Activities',
      text: isFr ? 'Certification, formation, financement équipements, couplage centres de transformation' : 'Certification, training, equipment funding, transformation center matching',
      border: 'border-t-[#B5850A]', dot: 'bg-[#B5850A]',
    },
    {
      label: isFr ? 'Résultats directs' : 'Outputs',
      text: isFr ? 'Producteurs certifiés, coopératives actives, opportunités financées, transactions export' : 'Certified producers, active cooperatives, funded opportunities, export transactions',
      border: 'border-t-purple-600', dot: 'bg-purple-600',
    },
    {
      label: isFr ? 'Effets' : 'Outcomes',
      text: isFr ? 'Augmentation du revenu agricole, réduction des pertes post-récolte, accès aux marchés régionaux et internationaux' : 'Increased farm income, reduced post-harvest losses, access to regional and international markets',
      border: 'border-t-blue-600', dot: 'bg-blue-600',
    },
    {
      label: isFr ? 'Impact' : 'Impact',
      text: isFr ? 'Souveraineté alimentaire africaine, réduction de la pauvreté rurale, modèle d\'agriculture durable réplicable' : 'African food sovereignty, reduced rural poverty, replicable sustainable agriculture model',
      border: 'border-t-green-600', dot: 'bg-green-600',
    },
  ];

  const progressSteps = [
    { state: 'done', label: isFr ? 'Plateforme lancée et déployée' : 'Platform launched and deployed' },
    { state: 'done', label: isFr ? 'Enregistrement agriculteurs et coopératives ouvert' : 'Farmer and cooperative registration open' },
    { state: 'done', label: isFr ? 'AfriYield Exchange opérationnel' : 'AfriYield Exchange operational' },
    { state: 'done', label: isFr ? 'Outils IA (sol, maladies, Think Tank) actifs' : 'AI tools (soil, disease, Think Tank) active' },
    { state: 'doing', label: isFr ? 'Premières coopératives en cours de vérification' : 'First cooperatives being verified' },
    { state: 'todo', label: isFr ? 'Premier investisseur diaspora couplé' : 'First diaspora investor matched' },
    { state: 'todo', label: isFr ? 'Première transaction AfriYield clôturée' : 'First AfriYield transaction closed' },
    { state: 'todo', label: isFr ? 'Premier retour sur investissement versé' : 'First investor ROI paid out' },
  ];

  const whyAfricaStats = [
    { value: '60%', label: isFr ? 'des terres arables mondiales non cultivées se trouvent en Afrique' : 'of the world\'s uncultivated arable land is in Africa' },
    { value: '$1T', label: isFr ? 'de valeur agricole non capturée par manque d\'infrastructure numérique' : 'in uncaptured agricultural value due to lack of digital infrastructure' },
    { value: '70%', label: isFr ? 'des africains dépendent de l\'agriculture pour leurs revenus' : 'of Africans depend on agriculture for their income' },
    { value: '40%', label: isFr ? 'de pertes post-récolte en l\'absence de chaîne froide et de transformation' : 'post-harvest losses without cold chain and processing' },
  ];

  return (
    <div style={{ background: '#F8F4E3' }}>

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #2d5a3d 100%)' }} className="text-white">
        <div className="section-container py-16 md:py-20 text-center">
          <span className="inline-block bg-[#B5850A]/20 text-[#B5850A] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            {isFr ? 'Impact & Transparence' : 'Impact & Transparency'}
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            {isFr ? 'Notre Impact — Données Réelles' : 'Our Impact — Real Data'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
            {isFr
              ? 'Transparence totale sur la croissance de la plateforme et l\'impact sur les communautés agricoles africaines. Toutes les données proviennent directement de notre base de données.'
              : 'Full transparency on platform growth and impact on African farming communities. All data comes directly from our database.'}
          </p>
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#B5850A]/40 bg-[#B5850A]/10 px-5 py-3 text-[#fff7df] text-sm font-semibold">
            <span className="animate-pulse w-2 h-2 rounded-full bg-[#B5850A] inline-block" />
            {isFr ? 'Données mises à jour en temps réel' : 'Data updated in real time'}
          </div>
        </div>
      </section>

      {/* Live metrics */}
      <section className="section-container py-14">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
          {isFr ? 'Métriques en temps réel' : 'Live Platform Metrics'}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          {isFr
            ? 'Ces chiffres reflètent l\'état actuel de la plateforme.'
            : 'These numbers reflect the current state of the platform.'}
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {metricCards.map(({ icon, value, label, sub, color, textColor }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${color} p-6 shadow-lg ${textColor}`}>
              <div className="mb-4 opacity-80">{icon}</div>
              {stats.loading ? (
                <Loader2 className="w-8 h-8 animate-spin opacity-60 mb-2" />
              ) : (
                <p className="text-5xl font-extrabold tabular-nums mb-2">{value}</p>
              )}
              <p className="font-semibold text-sm opacity-90">{label}</p>
              <p className="text-xs opacity-60 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Africa needs this */}
      <section className="section-container py-14 pt-0">
        <div className="rounded-3xl overflow-hidden" style={{ background: '#1a3c2e' }}>
          <div className="px-8 py-12">
            <h2 className="text-3xl font-extrabold text-white text-center mb-3">
              {isFr ? 'Pourquoi l\'Afrique a besoin de Sahel AgriConnect' : 'Why Africa Needs Sahel AgriConnect'}
            </h2>
            <p className="text-white/60 text-center mb-10 max-w-2xl mx-auto">
              {isFr
                ? 'Le continent africain possède le plus grand potentiel agricole non réalisé au monde. Les données parlent d\'elles-mêmes.'
                : 'The African continent has the world\'s greatest unrealized agricultural potential. The data speaks for itself.'}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyAfricaStats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-5xl font-extrabold text-[#B5850A] mb-2">{value}</p>
                  <p className="text-white/70 text-sm leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SDG Alignment */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
          {isFr ? 'Alignement avec les ODD de l\'ONU' : 'UN SDG Alignment'}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          {isFr
            ? 'Comment Sahel AgriConnect contribue aux Objectifs de Développement Durable'
            : 'How Sahel AgriConnect contributes to the Sustainable Development Goals'}
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          {sdgCards.map(c => (
            <div key={c.n} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm flex gap-4">
              <div className={`w-14 h-14 rounded-2xl ${c.color} text-white font-extrabold text-xl flex items-center justify-center flex-shrink-0`}>
                {c.n}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#1a3c2e]">ODD {c.n} — {c.label}</h3>
                <p className="mt-2 text-gray-600 text-sm leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Theory of Change */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
          {isFr ? 'Théorie du Changement' : 'Theory of Change'}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          {isFr
            ? 'Comment les intrants de la plateforme conduisent à un impact agricole durable'
            : 'How platform inputs lead to lasting agricultural impact'}
        </p>

        {/* Desktop flow */}
        <div className="hidden md:flex items-stretch gap-2">
          {tocStages.map((s, i) => (
            <div key={s.label} className="contents">
              <div className={`flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm border-t-4 ${s.border}`}>
                <p className="text-xs font-extrabold tracking-widest text-gray-500 uppercase mb-3">{s.label}</p>
                <p className="text-gray-700 text-sm leading-relaxed">{s.text}</p>
              </div>
              {i < tocStages.length - 1 && (
                <div className="flex items-center text-[#B5850A]" aria-hidden>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile stack */}
        <div className="md:hidden space-y-3">
          {tocStages.map((s, i) => (
            <div key={s.label}>
              <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm border-l-4 ${s.border.replace('border-t-', 'border-l-')}`}>
                <p className="text-xs font-extrabold tracking-widest text-gray-500 uppercase mb-2">{s.label}</p>
                <p className="text-gray-700 text-sm">{s.text}</p>
              </div>
              {i < tocStages.length - 1 && (
                <div className="text-center text-gray-300 text-2xl py-1" aria-hidden>↓</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* First transaction progress */}
      <section className="section-container py-14 pt-0">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
          {isFr ? 'Progression vers la première transaction' : 'Progress to First Transaction'}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          {isFr
            ? 'Sahel AgriConnect est une plateforme en croissance. Voici exactement où nous en sommes.'
            : 'Sahel AgriConnect is a growing platform. Here is exactly where we stand.'}
        </p>
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <div className="space-y-4">
            {progressSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-0.5">
                  {step.state === 'done' ? (
                    <span className="inline-flex w-7 h-7 rounded-full bg-[#1a3c2e] text-white items-center justify-center text-sm font-bold">✓</span>
                  ) : step.state === 'doing' ? (
                    <span className="inline-flex w-7 h-7 rounded-full bg-[#B5850A] text-white items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                    </span>
                  ) : (
                    <span className="inline-flex w-7 h-7 rounded-full bg-gray-100 text-gray-400 items-center justify-center text-xs font-bold border border-gray-200">
                      {i + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <p className={`text-sm font-semibold ${step.state === 'done' ? 'text-[#1a3c2e]' : step.state === 'doing' ? 'text-[#B5850A]' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              {isFr
                ? 'Cette transparence est notre engagement envers nos coopératives, investisseurs et partenaires.'
                : 'This transparency is our commitment to our cooperatives, investors, and partners.'}
            </p>
          </div>
        </div>
      </section>

      {/* Top crops breakdown — only if data exists */}
      {stats.farmers?.byCrop?.length > 0 && (
        <section className="section-container py-14 pt-0">
          <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
            {isFr ? 'Cultures les plus cultivées' : 'Most Cultivated Crops'}
          </h2>
          <p className="text-center text-gray-600 mb-10">
            {isFr ? 'Répartition des cultures déclarées par les agriculteurs inscrits' : 'Breakdown of crops declared by registered farmers'}
          </p>
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="space-y-3">
              {stats.farmers.byCrop.map(({ _id: crop, count }) => {
                const max = stats.farmers.byCrop[0]?.count || 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={crop}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{crop}</span>
                      <span className="font-bold text-[#1a3c2e]">{count} {isFr ? 'agriculteurs' : 'farmers'}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1a3c2e, #B5850A)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Resources section */}
      <section className="section-container py-14 pt-0 pb-20">
        <h2 className="text-3xl font-extrabold text-[#1a3c2e] text-center mb-3">
          {isFr ? 'Ressources & Documentation' : 'Resources & Documentation'}
        </h2>
        <p className="text-center text-gray-600 mb-10">
          {isFr
            ? 'Accédez aux informations clés, à la gouvernance et au cadre d\'investissement.'
            : 'Access key platform information, governance, and the investment framework.'}
        </p>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <span className="text-3xl mb-4">📋</span>
            <h3 className="text-lg font-extrabold text-[#1a3c2e] mb-2">
              {isFr ? 'Présentation de la Plateforme' : 'Platform Overview'}
            </h3>
            <p className="text-gray-600 text-sm mb-5 flex-1">
              {isFr
                ? 'Vue d\'ensemble de Sahel AgriConnect et AfriYield Exchange — objectifs, fonctionnalités et impact.'
                : 'Overview of Sahel AgriConnect and AfriYield Exchange — objectives, features, and impact.'}
            </p>
            <div className="space-y-2">
              <Link to="/about"
                className="block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#1a3c2e' }}>
                {isFr ? 'À propos de nous' : 'About us'}
              </Link>
              <Link to="/how-it-works"
                className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition">
                {isFr ? 'Comment ça marche' : 'How it works'}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#B5850A]/30 p-6 shadow-sm flex flex-col">
            <span className="text-3xl mb-4">💰</span>
            <h3 className="text-lg font-extrabold text-[#1a3c2e] mb-2">
              {isFr ? 'Prospectus d\'Investissement' : 'Investment Prospectus'}
            </h3>
            <p className="text-gray-600 text-sm mb-5 flex-1">
              {isFr
                ? 'Cadre d\'investissement AfriYield Exchange, structure ROI, termes et conditions. Envoyé sur demande aux investisseurs qualifiés.'
                : 'AfriYield Exchange investment framework, ROI structure, terms and conditions. Sent on request to qualified investors.'}
            </p>
            <div className="space-y-2">
              <a href="mailto:info@djiguicorporation.org?subject=Demande prospectus — AfriYield Exchange&body=Bonjour,%0A%0ANom: %0APays: %0AMontant envisagé: "
                className="block w-full text-center py-2.5 rounded-xl font-bold text-[#1a3c2e] text-sm"
                style={{ background: '#B5850A' }}>
                {isFr ? '📧 Demander le prospectus' : '📧 Request Prospectus'}
              </a>
              <Link to="/investor-relations"
                className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm border-2 border-[#B5850A] text-[#B5850A] hover:bg-[#B5850A]/5 transition">
                {isFr ? 'Relations investisseurs' : 'Investor Relations'}
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <span className="text-3xl mb-4">🔒</span>
            <h3 className="text-lg font-extrabold text-[#1a3c2e] mb-2">
              {isFr ? 'Politique de Gouvernance des Données' : 'Data Governance Policy'}
            </h3>
            <p className="text-gray-600 text-sm mb-5 flex-1">
              {isFr
                ? 'Notre cadre de souveraineté des données africaines, droits des coopératives et politique de confidentialité.'
                : 'Our African data sovereignty framework, cooperative rights, and privacy policy.'}
            </p>
            <div className="space-y-2">
              <Link to="/governance"
                className="block w-full text-center py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: '#1a3c2e' }}>
                {isFr ? 'Voir la politique' : 'View Policy'}
              </Link>
              <Link to="/privacy"
                className="block w-full text-center py-2.5 rounded-xl font-semibold text-sm border-2 border-[#1a3c2e] text-[#1a3c2e] hover:bg-[#1a3c2e]/5 transition">
                {isFr ? 'Confidentialité' : 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#1a3c2e' }} className="text-white">
        <div className="section-container py-16 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            {isFr ? 'Rejoignez l\'écosystème' : 'Join the Ecosystem'}
          </h2>
          <p className="text-white/70 mb-8 max-w-xl mx-auto">
            {isFr
              ? 'Que vous soyez agriculteur, coopérative ou investisseur diaspora, votre place est sur Sahel AgriConnect.'
              : 'Whether you are a farmer, cooperative, or diaspora investor, your place is on Sahel AgriConnect.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cooperative-registration"
              className="px-8 py-3.5 rounded-xl font-bold text-[#1a3c2e] text-sm"
              style={{ background: '#B5850A' }}>
              {isFr ? 'Inscrire ma coopérative' : 'Register my cooperative'}
            </Link>
            <Link to="/afri-yield"
              className="px-8 py-3.5 rounded-xl font-bold text-white border-2 border-white/30 hover:border-white transition text-sm">
              AfriYield Exchange →
            </Link>
            <Link to="/dashboard"
              className="px-8 py-3.5 rounded-xl font-bold text-white border-2 border-white/30 hover:border-white transition text-sm">
              {isFr ? 'Voir le dashboard' : 'View Dashboard'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
