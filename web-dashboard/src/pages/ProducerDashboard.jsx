import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config/api';
import { CheckCircle2, Clock, Package, ShieldCheck, Sparkles, Users, Trash2 } from 'lucide-react';
import { useRegisteredUser } from '../hooks/useRegisteredUser';

function apiUrl(path) {
  const base = String(API_BASE_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
}

function statusFromFarmer(farmer) {
  const s = String(farmer?.statut || '').toLowerCase();
  if (s.includes('attente')) return 'pending';
  if (s.includes('actif')) return 'active';
  if (String(farmer?.qualityLevel || '').toLowerCase() === 'international') return 'certified';
  return 'active';
}

function statusBadge(status, t) {
  if (status === 'pending')
    return { label: t('producerDashboard.profile.status.pending'), cls: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
  if (status === 'certified')
    return {
      label: t('producerDashboard.profile.status.certified'),
      cls: 'bg-[#fff7df] text-[#7a5b10] border-[#e9d7a7]',
    };
  return { label: t('producerDashboard.profile.status.active'), cls: 'bg-green-50 text-green-900 border-green-200' };
}

function progressForStatus(status) {
  if (status === 'pending') return 1;
  if (status === 'active') return 2;
  if (status === 'certified') return 3;
  return 1;
}

function normalizeListings(profile) {
  // No dedicated listing model yet; use placeholder from known fields when possible.
  // If the backend later adds listings, keep this shape: [{ commodity, qtyKgMonth, certification, active, updatedAt }]
  return Array.isArray(profile?.listings) ? profile.listings : [];
}

export default function ProducerDashboard() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const { registerUser } = useRegisteredUser();
  const [params, setParams] = useSearchParams();
  const initial = params.get('q') || '';
  const [identifier, setIdentifier] = useState(initial);
  const [mode, setMode] = useState('idle'); // idle | loading | ready | notfound | error
  const [profile, setProfile] = useState(null);
  const [profileType, setProfileType] = useState(null); // farmer | cooperative
  const [err, setErr] = useState('');
  const topRef = useRef(null);

  const load = async (qRaw) => {
    const q = String(qRaw || '').trim();
    if (!q) return;

    setMode('loading');
    setErr('');
    setProfile(null);
    setProfileType(null);

    const isEmail = q.includes('@');
    const qp = new URLSearchParams(isEmail ? { email: q } : { phone: q });

    try {
      // Try farmer first
      const rf = await fetch(apiUrl(`/api/farmers?${qp.toString()}`));
      if (rf.ok) {
        const jf = await rf.json().catch(() => ({}));
        if (jf?.farmer) {
          setProfile(jf.farmer);
          setProfileType('farmer');
          setMode('ready');
          registerUser(q, jf.farmer?.nomComplet || jf.farmer?.fullName || jf.farmer?.nom || '');
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      // Then cooperative registration
      const rc = await fetch(apiUrl(`/api/cooperatives?${qp.toString()}`));
      if (rc.ok) {
        const jc = await rc.json().catch(() => ({}));
        if (jc?.cooperative) {
          setProfile(jc.cooperative);
          setProfileType('cooperative');
          setMode('ready');
          registerUser(q, jc.cooperative?.leaderName || jc.cooperative?.fullName || jc.cooperative?.cooperativeName || '');
          topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
      }

      setMode('notfound');
    } catch (e) {
      setErr(e?.message || 'Erreur');
      setMode('error');
    }
  };

  useEffect(() => {
    if (initial) load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derived = useMemo(() => {
    if (!profile || !profileType) return null;

    const isCoop = profileType === 'cooperative';
    const name = isCoop ? profile.cooperativeName : profile.nom;
    const country = profile.country || '—';
    const createdAt = profile.createdAt;

    const status = isCoop ? (profile.status || 'pending') : statusFromFarmer(profile);
    const stepsFilled = progressForStatus(status);
    const badge = statusBadge(status, t);

    const listings = normalizeListings(profile);

    return { isCoop, name, country, createdAt, status, stepsFilled, badge, listings };
  }, [profile, profileType]);

  if (mode !== 'ready') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12" ref={topRef}>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 md:p-8 max-w-xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a3c2e]">{t('producerDashboard.identify.title')}</h1>
          <p className="mt-2 text-gray-600">{t('producerDashboard.identify.subtitle')}</p>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const q = String(identifier || '').trim();
              setParams(q ? { q } : {});
              load(q);
            }}
          >
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t('producerDashboard.identify.placeholder')}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-700 outline-none"
            />
            <button
              type="submit"
              disabled={mode === 'loading'}
              className="w-full rounded-xl bg-[#1a3c2e] text-white font-extrabold py-3 hover:bg-[#143326] disabled:opacity-60"
            >
              {mode === 'loading' ? t('common.loading') : t('producerDashboard.identify.submit')}
            </button>
          </form>

          {mode === 'notfound' ? (
            <div className="mt-4 text-sm text-red-700 space-y-2">
              <p>{t('producerDashboard.identify.notFound')}</p>
              <Link to="/dashboard" className="inline-flex font-bold text-[#1a3c2e] underline underline-offset-4">
                {t('producerDashboard.identify.registerLink')}
              </Link>
            </div>
          ) : null}
          {mode === 'error' ? (
            <p className="mt-4 text-sm text-red-700">{err || t('common.error')}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const { isCoop, name, country, createdAt, status, stepsFilled, badge, listings } = derived;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10" ref={topRef}>
      {/* Section A — Profile Status */}
      <section className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white mb-8">
        <div className="bg-[#1a3c2e] text-white px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{t('producerDashboard.profile.title')}</h1>
            <p className="text-white/80 text-sm">{t('producerDashboard.title')}</p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold ${badge.cls}`}>
            {status === 'pending' ? <Clock className="w-4 h-4" aria-hidden /> : null}
            {status === 'active' ? <CheckCircle2 className="w-4 h-4" aria-hidden /> : null}
            {status === 'certified' ? <ShieldCheck className="w-4 h-4" aria-hidden /> : null}
            {badge.label}
          </span>
        </div>

        <div className="px-6 py-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('cooperativeReg.form.leaderName')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{name || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('cooperativeReg.form.country')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{country}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('producerDashboard.profile.registered')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{fmtDate(createdAt)}</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-bold text-gray-700 mb-2">{t('producerDashboard.profile.steps.registered')}</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                t('producerDashboard.profile.steps.registered'),
                t('producerDashboard.profile.steps.verified'),
                t('producerDashboard.profile.steps.certified'),
                t('producerDashboard.profile.steps.exportReady'),
              ].map((label, idx) => {
                const filled = idx + 1 <= stepsFilled;
                return (
                  <div key={label} className="text-center">
                    <div className={`h-2 rounded-full ${filled ? 'bg-[#B5850A]' : 'bg-gray-200'}`} />
                    <p className={`mt-2 text-[11px] font-bold ${filled ? 'text-[#1a3c2e]' : 'text-gray-500'}`}>{label}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-[#fff7df] p-4 text-sm text-gray-800">
            {status === 'pending' ? (
              <p>{t('producerDashboard.profile.pendingMsg')}</p>
            ) : status === 'certified' ? (
              <p>{t('producerDashboard.profile.certifiedMsg')}</p>
            ) : (
              <p>{t('producerDashboard.profile.activeMsg')}</p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <Link
          to="/farmer-needs"
          className="block rounded-2xl border-2 border-dashed border-[#B5850A]/40 p-4 text-center hover:border-[#B5850A] hover:bg-[#B5850A]/5 transition"
        >
          <span className="text-2xl">🌾</span>
          <p className="font-semibold text-[#1a3c2e] text-sm mt-2">
            {isFr ? 'Soumettre un besoin' : 'Submit a Need'}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {isFr ? 'Équipement, formation, certification...' : 'Equipment, training, certification...'}
          </p>
        </Link>
      </section>

      {/* Section B — My Listings */}
      <section className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-extrabold text-[#1a3c2e] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#B5850A]" aria-hidden />
            {t('producerDashboard.listings.title')}
          </h2>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-[#1a3c2e] text-white font-bold px-4 py-2.5 hover:bg-[#143326]"
            state={{ subject: 'Nouvelle liste de produit' }}
          >
            {t('producerDashboard.listings.addProduct')}
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700">
            {t('producerDashboard.listings.noListings')}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {listings.map((l) => (
              <div key={`${l.commodity}-${l.updatedAt}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-extrabold text-[#1a3c2e]">{l.commodity}</p>
                    <p className="text-sm text-gray-600">{l.qtyKgMonth ? `${l.qtyKgMonth} kg/mois` : '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-gray-50 text-gray-800 border-gray-200">
                      {l.certification || '—'}
                    </span>
                    {l.active ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-800 border border-green-100">
                        {t('producerDashboard.listings.visible')}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  {t('producerDashboard.listings.lastUpdated')}: {fmtDate(l.updatedAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section C — Cooperative Benefits */}
      {isCoop ? (
        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-extrabold text-[#1a3c2e] flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#B5850A]" aria-hidden />
            {t('producerDashboard.cooperative.title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('producerDashboard.cooperative.equipment')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{t('producerDashboard.cooperative.equipmentStatus.available')}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('producerDashboard.cooperative.certification')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{profile?.certificationStatus || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('producerDashboard.cooperative.members')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">{profile?.memberCount ?? '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold text-gray-500 uppercase">{t('producerDashboard.cooperative.nextMeeting')}</p>
              <p className="mt-1 font-extrabold text-[#1a3c2e]">—</p>
            </div>
          </div>
          <Link
            to="/equipment-fund"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#B5850A] text-white font-extrabold px-5 py-2.5 hover:bg-[#9a7109]"
          >
            {t('producerDashboard.cooperative.viewBenefits')}
          </Link>
        </section>
      ) : null}

      {/* Section D — AI Tools History */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-[#1a3c2e] flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-[#B5850A]" aria-hidden />
          {t('producerDashboard.aiHistory.title')}
        </h2>

        <div className="grid md:grid-cols-3 gap-4">
          <AiCard
            title={t('producerDashboard.aiHistory.soil')}
            body={t('producerDashboard.aiHistory.noHistory')}
            to="/diagnostic-sol"
          />
          <AiCard
            title={t('producerDashboard.aiHistory.disease')}
            body={
              profileType === 'farmer' && profile?.diseaseDetection?.disease
                ? `${t('producerDashboard.listings.lastUpdated')}: ${profile.diseaseDetection.disease}`
                : t('producerDashboard.aiHistory.noHistory')
            }
            to="/detection-maladies"
          />
          <AiCard
            title={t('producerDashboard.aiHistory.thinkTank')}
            body={t('producerDashboard.aiHistory.noHistory')}
            to="/think-tank"
          />
        </div>

        <p className="mt-5 text-sm text-gray-600">
          {t('producerDashboard.aiHistory.noHistory')}
        </p>
      </section>

      <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-2">
        <Link
          to={isCoop ? '/delete-account?type=cooperative' : '/delete-account?type=farmer'}
          className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-600 hover:underline transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {i18n.language === 'fr'
            ? isCoop
              ? 'Supprimer mon compte coopérative'
              : 'Supprimer mon profil'
            : isCoop
              ? 'Delete my cooperative account'
              : 'Delete my profile'}
        </Link>
      </div>
    </div>
  );
}

function AiCard({ title, body, to }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-[#1a3c2e]">{title}</p>
          <p className="mt-2 text-sm text-gray-600">{body}</p>
        </div>
      </div>
      <Link
        to={to}
        className="mt-4 inline-flex items-center justify-center w-full rounded-xl border-2 border-[#1a3c2e] text-[#1a3c2e] font-extrabold py-2.5 hover:bg-[#1a3c2e] hover:text-white transition"
      >
        {t('producerDashboard.aiHistory.redo')}
      </Link>
    </div>
  );
}

