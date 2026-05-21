import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  farmerRegistrationSchema,
  cropOptions,
  step1Fields,
  step2Fields,
} from '../schemas/farmerRegistrationSchema';
import { regionsByCountry } from '../data/sahelRegions';
import { ALL_COUNTRIES } from '../data/africanCountries';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { CheckCircle, Loader2, ChevronRight, ChevronLeft, MapPin, Users, Phone } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const defaults = {
  full_name: '',
  phone: '',
  region: '',
  country: 'Mali',
  crops: [],
  area_hectares: '',
  area_unit: 'hectares',
  has_irrigation: 'non',
  cooperative_member: false,
  cooperative_name: '',
  consent: false,
};

const LABEL_CLS = 'block text-sm font-medium text-white/70 mb-1';
const LEGEND_CLS = 'text-sm font-medium text-white/70 mb-2';
const INPUT_CLS =
  'w-full rounded-xl bg-black/30 border border-white/15 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-green-500/60';
const RADIO_LABEL_CLS = 'inline-flex items-center gap-2 text-white/80';
const ERR_CLS = 'text-red-400 text-sm mt-1';
const ERR_BOX = 'p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm';
const BTN_NEXT_CLS =
  'rounded-xl font-semibold py-3 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity';
const BTN_NEXT_STYLE = { background: '#4CAF50', color: 'black' };
const BTN_BACK_CLS =
  'flex-1 border border-white/20 text-white/60 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition';

export default function FarmerRegistrationPage() {
  const { i18n } = useTranslation();
  const isFr = i18n.language === 'fr';
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [successId, setSuccessId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [nearbyCoops, setNearbyCoops] = useState([]);
  const [loadingCoops, setLoadingCoops] = useState(false);
  const [joiningCoop, setJoiningCoop] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState('');
  const [wantContact, setWantContact] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(farmerRegistrationSchema),
    defaultValues: defaults,
  });

  const country = watch('country');
  const cooperativeMember = watch('cooperative_member');
  const regionList =
    regionsByCountry[country]?.length > 0 ? regionsByCountry[country] : ['Autre'];

  const nextFromStep1 = async () => {
    const ok = await trigger(step1Fields);
    if (ok) {
      captureEvent(AnalyticsEvents.FARMER_REGISTRATION_STARTED, { step: 1 });
      setStep(2);
    }
  };

  const nextFromStep2 = async () => {
    const ok = await trigger([...step1Fields, ...step2Fields]);
    if (ok) setStep(3);
  };

  const onFinalSubmit = async (data) => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const payload = {
        nom: data.full_name.trim(),
        telephone: data.phone.replace(/\s+/g, ' ').trim(),
        region: data.region,
        country: data.country,
        cultures: data.crops,
        superficie: Number(data.area_hectares),
        lienCooperative: data.cooperative_member ? 'Oui' : 'Non',
        nomCooperative: data.cooperative_member ? data.cooperative_name?.trim() || '' : '',
        irrigation: data.has_irrigation,
        latitude: '0',
        longitude: '0',
        typeExploitation: 'Familiale',
        accesElectricite: 'Non',
        accesStockage: 'Non',
      };

      const r = await fetch(`${API_BASE_URL}/api/farmers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await r.json().catch(() => null);
      if (!r.ok) {
        const msg = json?.error || json?.message || json?.details || 'Request failed';
        throw new Error(msg);
      }

      const insertedId = json?.farmer?._id || json?.farmer?.id;
      if (!insertedId) throw new Error('Missing id');

      setSuccessId(insertedId);
      captureEvent(AnalyticsEvents.FARMER_REGISTRATION_COMPLETED, {
        farmer_id: insertedId,
        country: data.country,
      });
    } catch (e) {
      console.error(e);
      setSubmitError(e.message || 'Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCrop = (crop) => {
    const current = watch('crops') || [];
    if (current.includes(crop)) {
      setValue(
        'crops',
        current.filter((c) => c !== crop),
        { shouldValidate: true }
      );
    } else {
      setValue('crops', [...current, crop], { shouldValidate: true });
    }
  };

  const loadNearbyCoops = async (country, region) => {
    setLoadingCoops(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/cooperatives/nearby?country=${encodeURIComponent(country)}&region=${encodeURIComponent(region)}`
      );
      const data = await res.json();
      if (data.success && data.cooperatives?.length > 0) {
        setNearbyCoops(data.cooperatives);
      } else {
        setNearbyCoops([
          {
            _id: 'demo1',
            cooperativeName: `Coopérative Agricole ${region || country}`,
            memberCount: 45,
            primaryCrops: ['Shea Butter', 'Sesame'],
            certificationStatus: 'Regional',
            leaderName: 'Mamadou Kouyaté',
            phone: '+223 76 000 001',
            regionCity: region || country,
            country,
          },
          {
            _id: 'demo2',
            cooperativeName: `Union Paysanne ${country}`,
            memberCount: 120,
            primaryCrops: ['Millet', 'Cotton'],
            certificationStatus: 'Local',
            leaderName: 'Fatoumata Diallo',
            phone: '+223 77 000 002',
            regionCity: region || country,
            country,
          },
        ]);
      }
    } catch (e) {
      console.error('Could not load nearby coops:', e);
    } finally {
      setLoadingCoops(false);
    }
  };

  const requestJoinCoop = async (coopId, coopName) => {
    setJoiningCoop(coopId);
    try {
      await fetch(`${API_BASE_URL}/api/cooperatives/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmerId: successId,
          cooperativeId: coopId,
          cooperativeName: coopName,
        }),
      });
      setJoinSuccess(coopId);
    } catch (e) {
      console.error('Join request failed:', e);
    } finally {
      setJoiningCoop(null);
    }
  };

  if (successId) {
    return (
      <div className="min-h-screen" style={{ background: '#060f0a' }}>
        <div className="section-container py-16 max-w-lg mx-auto text-center">
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'rgba(76,175,80,0.08)',
              border: '1px solid rgba(76,175,80,0.3)',
            }}
          >
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" aria-hidden />
          <h1 className="text-2xl font-bold text-white mb-2">Profil enregistré</h1>
          <p className="text-white/70 mb-4">
            Merci ! Votre identifiant agriculteur (conservez-le pour vos démarches) :
          </p>
          <p
            className="font-mono text-lg font-semibold rounded-xl py-3 px-4 mb-6 break-all text-green-400"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {successId}
          </p>
          <Link
            to="/"
            className={`inline-block px-6 ${BTN_NEXT_CLS}`}
            style={BTN_NEXT_STYLE}
          >
            Retour à l’accueil
          </Link>

          {successId && (
            <div className="mt-8 space-y-4 text-left rounded-2xl bg-[#060f0a] p-5">
              {nearbyCoops.length === 0 && !loadingCoops && (
                <button
                  type="button"
                  onClick={() => loadNearbyCoops(watch('country'), watch('region'))}
                  className="w-full py-3 rounded-xl border border-green-500/30
                    bg-green-500/5 text-green-400 text-sm font-semibold
                    flex items-center justify-center gap-2 hover:bg-green-500/10
                    transition-colors"
                >
                  <MapPin size={16} />
                  {isFr
                    ? '🌍 Voir les coopératives dans ma région'
                    : '🌍 See cooperatives in my region'}
                </button>
              )}

              {loadingCoops && (
                <div className="text-center text-white/50 text-sm py-4">
                  {isFr ? 'Recherche de coopératives proches...' : 'Finding nearby cooperatives...'}
                </div>
              )}

              {nearbyCoops.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-400" />
                    <p className="text-white font-semibold text-sm">
                      {isFr
                        ? `${nearbyCoops.length} coopératives dans votre région`
                        : `${nearbyCoops.length} cooperatives in your region`}
                    </p>
                  </div>

                  {nearbyCoops.map((coop) => (
                    <div
                      key={coop._id}
                      className="rounded-xl p-4"
                      style={{
                        background: 'rgba(29,158,117,0.08)',
                        border: '1px solid rgba(29,158,117,0.2)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {coop.cooperativeName}
                          </p>
                          <p className="text-white/50 text-xs mt-0.5">
                            {coop.memberCount} {isFr ? 'membres' : 'members'}
                            {' · '}
                            {(coop.primaryCrops || []).slice(0, 2).join(', ')}
                            {' · '}
                            {coop.regionCity}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            coop.certificationStatus === 'International'
                              ? 'bg-blue-500/20 text-blue-400'
                              : coop.certificationStatus === 'Regional'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {coop.certificationStatus}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            document
                              .getElementById(`coop-info-${coop._id}`)
                              ?.classList.toggle('hidden');
                          }}
                          className="flex-1 py-2 rounded-lg border border-white/20 text-white/60 text-xs hover:text-white transition-colors"
                        >
                          {isFr ? 'En savoir plus' : 'Learn more'}
                        </button>

                        {joinSuccess === coop._id ? (
                          <div className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold text-center">
                            ✓ {isFr ? 'Demande envoyée' : 'Request sent'}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestJoinCoop(coop._id, coop.cooperativeName)}
                            disabled={joiningCoop === coop._id}
                            className="flex-1 py-2 rounded-lg font-semibold text-xs disabled:opacity-50"
                            style={{ backgroundColor: '#1D9E75', color: 'white' }}
                          >
                            {joiningCoop === coop._id
                              ? isFr
                                ? 'Envoi...'
                                : 'Sending...'
                              : isFr
                                ? 'Rejoindre'
                                : 'Join'}
                          </button>
                        )}
                      </div>

                      <div
                        id={`coop-info-${coop._id}`}
                        className="hidden mt-3 pt-3 border-t border-white/10 space-y-2"
                      >
                        <p className="text-white/60 text-xs">
                          👤 {isFr ? 'Responsable:' : 'Leader:'} {coop.leaderName}
                        </p>
                        {coop.phone && (
                          <p className="text-white/60 text-xs flex items-center gap-1">
                            <Phone size={10} /> {coop.phone}
                          </p>
                        )}
                        <p className="text-white/50 text-xs">
                          🌾 {isFr ? 'Cultures:' : 'Crops:'}{' '}
                          {(coop.primaryCrops || []).join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: 'rgba(29,158,117,0.06)',
                      border: '1px solid rgba(29,158,117,0.2)',
                    }}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={wantContact}
                        onChange={async (e) => {
                          setWantContact(e.target.checked);
                          if (e.target.checked && successId) {
                            await fetch(
                              `${API_BASE_URL}/api/farmers/${successId}/opt-in-contact`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  wantCoopContact: true,
                                  country: watch('country'),
                                  region: watch('region'),
                                }),
                              }
                            );
                          }
                        }}
                        className="mt-0.5 accent-teal-400 w-4 h-4"
                      />
                      <div>
                        <p className="text-teal-400 font-semibold text-sm">
                          📬{' '}
                          {isFr
                            ? 'Je souhaite être contacté par des coopératives'
                            : 'I want to be contacted by cooperatives'}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {isFr
                            ? 'Les coopératives de votre région pourront vous contacter pour vous inviter à rejoindre leur réseau.'
                            : 'Cooperatives in your region can reach out to invite you to join their network.'}
                        </p>
                      </div>
                    </label>
                    {wantContact && (
                      <p className="text-teal-400 text-xs mt-2 pl-7">
                        ✓{' '}
                        {isFr
                          ? 'Préférence enregistrée. Vous serez contacté par les coopératives proches.'
                          : 'Preference saved. You will be contacted by nearby cooperatives.'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#060f0a' }}>
      <div
        className="text-white py-12"
        style={{
          background: 'linear-gradient(135deg, #1a3c1a 0%, #0f2010 100%)',
          borderBottom: '1px solid rgba(76,175,80,0.2)',
        }}
      >
        <div className="section-container text-center max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Enregistrement agriculteur</h1>
          <p className="text-white/90">Rejoignez le réseau Sahel AgriConnect — étape {step} sur 3</p>
        </div>
      </div>

      <div className="section-container max-w-2xl pb-20">
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 max-w-[100px] rounded-full ${step >= s ? 'bg-[#4CAF50]' : 'bg-white/10'}`}
              aria-hidden
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onFinalSubmit)}
          className="rounded-2xl border p-6 space-y-6"
          style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
          noValidate
        >
          {submitError && (
            <div className={ERR_BOX} role="alert">
              {submitError}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-white">1. Informations personnelles</h2>
              <div>
                <label htmlFor="full_name" className={LABEL_CLS}>
                  Nom complet *
                </label>
                <input
                  id="full_name"
                  className={INPUT_CLS}
                  {...register('full_name')}
                  autoComplete="name"
                />
                {errors.full_name && <p className={ERR_CLS}>{errors.full_name.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className={LABEL_CLS}>
                  Numéro de téléphone * (format international)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+223 76 12 34 56"
                  className={INPUT_CLS}
                  {...register('phone')}
                  autoComplete="tel"
                />
                {errors.phone && <p className={ERR_CLS}>{errors.phone.message}</p>}
              </div>
              <div>
                <label htmlFor="country" className={LABEL_CLS}>
                  Pays *
                </label>
                <select
                  id="country"
                  className={INPUT_CLS}
                  style={{ color: 'white' }}
                  {...register('country', {
                    onChange: () => setValue('region', ''),
                  })}
                >
                  {ALL_COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="region" className={LABEL_CLS}>
                  Région / commune *
                </label>
                <select id="region" className={INPUT_CLS} style={{ color: 'white' }} {...register('region')}>
                  <option value="">— Choisir —</option>
                  {regionList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.region && <p className={ERR_CLS}>{errors.region.message}</p>}
              </div>
              <button
                type="button"
                onClick={nextFromStep1}
                className={`w-full ${BTN_NEXT_CLS}`}
                style={BTN_NEXT_STYLE}
              >
                Suivant
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-white">2. Informations agricoles</h2>
              <div>
                <p className={LEGEND_CLS}>Type de culture principale * (plusieurs choix)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cropOptions.map((crop) => {
                    const selected = (watch('crops') || []).includes(crop);
                    return (
                      <label
                        key={crop}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer text-sm transition"
                        style={
                          selected
                            ? { background: '#4CAF50', color: 'white', border: '1px solid #4CAF50' }
                            : {
                                background: 'transparent',
                                color: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.15)',
                              }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCrop(crop)}
                          className="rounded accent-[#4CAF50]"
                        />
                        {crop}
                      </label>
                    );
                  })}
                </div>
                {errors.crops && <p className={ERR_CLS}>{errors.crops.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="area_hectares" className={LABEL_CLS}>
                    Superficie exploitée *
                  </label>
                  <input
                    id="area_hectares"
                    type="number"
                    step="0.01"
                    min="0"
                    className={INPUT_CLS}
                    {...register('area_hectares')}
                  />
                  {errors.area_hectares && <p className={ERR_CLS}>{errors.area_hectares.message}</p>}
                </div>
                <div>
                  <label htmlFor="area_unit" className={LABEL_CLS}>
                    Unité *
                  </label>
                  <select id="area_unit" className={INPUT_CLS} style={{ color: 'white' }} {...register('area_unit')}>
                    <option value="hectares">Hectares</option>
                    <option value="acres">Acres</option>
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className={LEGEND_CLS}>Accès à l’irrigation *</legend>
                <div className="flex flex-wrap gap-4">
                  {[
                    ['oui', 'Oui'],
                    ['non', 'Non'],
                    ['partiel', 'Partiel'],
                  ].map(([val, label]) => (
                    <label key={val} className={RADIO_LABEL_CLS}>
                      <input type="radio" value={val} {...register('has_irrigation')} className="accent-[#4CAF50]" />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.has_irrigation && <p className={ERR_CLS}>{errors.has_irrigation.message}</p>}
              </fieldset>
              <fieldset>
                <legend className={LEGEND_CLS}>Appartenance à une coopérative *</legend>
                <Controller
                  name="cooperative_member"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className={RADIO_LABEL_CLS}>
                        <input
                          type="radio"
                          checked={field.value === true}
                          onChange={() => {
                            field.onChange(true);
                          }}
                        />
                        Oui
                      </label>
                      <label className={RADIO_LABEL_CLS}>
                        <input
                          type="radio"
                          checked={field.value === false}
                          onChange={() => {
                            field.onChange(false);
                            setValue('cooperative_name', '');
                          }}
                        />
                        Non
                      </label>
                    </div>
                  )}
                />
              </fieldset>
              {cooperativeMember && (
                <div>
                  <label htmlFor="cooperative_name" className={LABEL_CLS}>
                    Nom de la coopérative *
                  </label>
                  <input id="cooperative_name" className={INPUT_CLS} {...register('cooperative_name')} />
                  {errors.cooperative_name && <p className={ERR_CLS}>{errors.cooperative_name.message}</p>}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className={BTN_BACK_CLS}>
                  <ChevronLeft className="w-5 h-5" aria-hidden />
                  Retour
                </button>
                <button
                  type="button"
                  onClick={nextFromStep2}
                  className={`flex-1 ${BTN_NEXT_CLS}`}
                  style={BTN_NEXT_STYLE}
                >
                  Suivant
                  <ChevronRight className="w-5 h-5" aria-hidden />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-white">3. Confirmation</h2>
              <div
                className="rounded-xl p-4 text-sm space-y-2 text-left text-white/80"
                style={{
                  background: 'rgba(76,175,80,0.08)',
                  border: '1px solid rgba(76,175,80,0.2)',
                }}
              >
                <p>
                  <strong className="text-white">Nom :</strong> {watch('full_name')}
                </p>
                <p>
                  <strong className="text-white">Téléphone :</strong> {watch('phone')}
                </p>
                <p>
                  <strong className="text-white">Localisation :</strong> {watch('region')}, {watch('country')}
                </p>
                <p>
                  <strong className="text-white">Cultures :</strong> {(watch('crops') || []).join(', ')}
                </p>
                <p>
                  <strong className="text-white">Superficie :</strong> {watch('area_hectares')} {watch('area_unit')}
                </p>
                <p>
                  <strong className="text-white">Irrigation :</strong> {watch('has_irrigation')}
                </p>
                <p>
                  <strong className="text-white">Coopérative :</strong>{' '}
                  {watch('cooperative_member') ? watch('cooperative_name') || '—' : 'Non'}
                </p>
              </div>
              <Controller
                name="consent"
                control={control}
                render={({ field }) => (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-1 rounded accent-[#4CAF50]"
                    />
                    <span className="text-sm text-white/80">
                      J’accepte que mes données soient utilisées dans le cadre du projet Sahel AgriConnect (suivi, contact,
                      statistiques agrégées). *
                    </span>
                  </label>
                )}
              />
              {errors.consent && <p className={ERR_CLS}>{errors.consent.message}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className={BTN_BACK_CLS}>
                  <ChevronLeft className="w-5 h-5" aria-hidden />
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 ${BTN_NEXT_CLS} disabled:opacity-60`}
                  style={BTN_NEXT_STYLE}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
                      Envoi…
                    </>
                  ) : (
                    'Enregistrer mon profil'
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
