import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import {
  farmerRegistrationSchema,
  cropOptions,
  step1Fields,
  step2Fields,
} from '../schemas/farmerRegistrationSchema';
import { regionsByCountry } from '../data/sahelRegions';
import { AFRICAN_COUNTRIES } from '../data/africanCountries';
import { captureEvent, AnalyticsEvents } from '../lib/analytics';
import { CheckCircle, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
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
  const [step, setStep] = useState(1);
  const [submitError, setSubmitError] = useState('');
  const [successId, setSuccessId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      setSubmitError(
        e.message?.includes('row-level security')
          ? 'Accès refusé par la base de données. Vérifiez les politiques RLS dans Supabase.'
          : e.message || 'Une erreur est survenue. Réessayez plus tard.'
      );
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
                  {AFRICAN_COUNTRIES.map((c) => (
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
