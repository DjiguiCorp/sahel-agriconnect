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
      <div className="section-container py-16 max-w-lg mx-auto text-center">
        <div className="card border-2 border-brand-sage">
          <CheckCircle className="w-16 h-16 text-brand-sage mx-auto mb-4" aria-hidden />
          <h1 className="text-2xl font-bold text-brand-forest mb-2">Profil enregistré</h1>
          <p className="text-gray-600 mb-4">
            Merci ! Votre identifiant agriculteur (conservez-le pour vos démarches) :
          </p>
          <p className="font-mono text-lg font-semibold bg-brand-cream/80 rounded-lg py-3 px-4 mb-6 break-all">{successId}</p>
          <Link to="/" className="btn-primary inline-block">
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
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
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

                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
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
    );
  }

  return (
    <div className="bg-brand-cream/40 min-h-[60vh]">
      <div className="bg-gradient-to-br from-brand-forest to-brand-sage text-white py-12">
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
              className={`h-2 flex-1 max-w-[100px] rounded-full ${step >= s ? 'bg-brand-sage' : 'bg-gray-200'}`}
              aria-hidden
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit(onFinalSubmit)}
          className="card space-y-6"
          noValidate
        >
          {submitError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm" role="alert">
              {submitError}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-brand-forest">1. Informations personnelles</h2>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet *
                </label>
                <input
                  id="full_name"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
                  {...register('full_name')}
                  autoComplete="name"
                />
                {errors.full_name && <p className="text-red-600 text-sm mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro de téléphone * (format international)
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+223 76 12 34 56"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
                  {...register('phone')}
                  autoComplete="tel"
                />
                {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                  Pays *
                </label>
                <select
                  id="country"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
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
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Région / commune *
                </label>
                <select id="region" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage" {...register('region')}>
                  <option value="">— Choisir —</option>
                  {regionList.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="text-red-600 text-sm mt-1">{errors.region.message}</p>}
              </div>
              <button type="button" onClick={nextFromStep1} className="btn-primary w-full flex items-center justify-center gap-2">
                Suivant
                <ChevronRight className="w-5 h-5" aria-hidden />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-brand-forest">2. Informations agricoles</h2>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Type de culture principale * (plusieurs choix)</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {cropOptions.map((crop) => {
                    const selected = (watch('crops') || []).includes(crop);
                    return (
                      <label
                        key={crop}
                        className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer text-sm ${
                          selected ? 'border-brand-sage bg-brand-iconBg' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCrop(crop)}
                          className="rounded border-gray-300 text-brand-sage focus:ring-brand-sage"
                        />
                        {crop}
                      </label>
                    );
                  })}
                </div>
                {errors.crops && <p className="text-red-600 text-sm mt-1">{errors.crops.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="area_hectares" className="block text-sm font-medium text-gray-700 mb-1">
                    Superficie exploitée *
                  </label>
                  <input
                    id="area_hectares"
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
                    {...register('area_hectares')}
                  />
                  {errors.area_hectares && <p className="text-red-600 text-sm mt-1">{errors.area_hectares.message}</p>}
                </div>
                <div>
                  <label htmlFor="area_unit" className="block text-sm font-medium text-gray-700 mb-1">
                    Unité *
                  </label>
                  <select id="area_unit" className="w-full border rounded-lg px-3 py-2" {...register('area_unit')}>
                    <option value="hectares">Hectares</option>
                    <option value="acres">Acres</option>
                  </select>
                </div>
              </div>
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">Accès à l’irrigation *</legend>
                <div className="flex flex-wrap gap-4">
                  {[
                    ['oui', 'Oui'],
                    ['non', 'Non'],
                    ['partiel', 'Partiel'],
                  ].map(([val, label]) => (
                    <label key={val} className="inline-flex items-center gap-2">
                      <input type="radio" value={val} {...register('has_irrigation')} className="text-brand-sage" />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.has_irrigation && <p className="text-red-600 text-sm mt-1">{errors.has_irrigation.message}</p>}
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium text-gray-700 mb-2">Appartenance à une coopérative *</legend>
                <Controller
                  name="cooperative_member"
                  control={control}
                  render={({ field }) => (
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="radio"
                          checked={field.value === true}
                          onChange={() => {
                            field.onChange(true);
                          }}
                        />
                        Oui
                      </label>
                      <label className="inline-flex items-center gap-2">
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
                  <label htmlFor="cooperative_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la coopérative *
                  </label>
                  <input
                    id="cooperative_name"
                    className="w-full border rounded-lg px-3 py-2"
                    {...register('cooperative_name')}
                  />
                  {errors.cooperative_name && (
                    <p className="text-red-600 text-sm mt-1">{errors.cooperative_name.message}</p>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden />
                  Retour
                </button>
                <button type="button" onClick={nextFromStep2} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  Suivant
                  <ChevronRight className="w-5 h-5" aria-hidden />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-xl font-semibold text-brand-forest">3. Confirmation</h2>
              <div className="bg-brand-cream/60 rounded-lg p-4 text-sm space-y-2 text-left">
                <p>
                  <strong>Nom :</strong> {watch('full_name')}
                </p>
                <p>
                  <strong>Téléphone :</strong> {watch('phone')}
                </p>
                <p>
                  <strong>Localisation :</strong> {watch('region')}, {watch('country')}
                </p>
                <p>
                  <strong>Cultures :</strong> {(watch('crops') || []).join(', ')}
                </p>
                <p>
                  <strong>Superficie :</strong> {watch('area_hectares')} {watch('area_unit')}
                </p>
                <p>
                  <strong>Irrigation :</strong> {watch('has_irrigation')}
                </p>
                <p>
                  <strong>Coopérative :</strong>{' '}
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
                      className="mt-1 rounded border-gray-300 text-brand-sage focus:ring-brand-sage"
                    />
                    <span className="text-sm text-gray-700">
                      J’accepte que mes données soient utilisées dans le cadre du projet Sahel AgriConnect (suivi, contact,
                      statistiques agrégées). *
                    </span>
                  </label>
                )}
              />
              {errors.consent && <p className="text-red-600 text-sm">{errors.consent.message}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" aria-hidden />
                  Retour
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary flex items-center justify-center gap-2">
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
