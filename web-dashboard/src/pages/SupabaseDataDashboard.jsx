import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Loader2, Lock, BarChart3 } from 'lucide-react';

const SESSION_KEY = 'sahel_supabase_admin_ok';

async function fetchFarmers() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('farmers').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function aggregateByCountry(rows) {
  const map = { Mali: 0, 'Burkina Faso': 0, Niger: 0 };
  rows.forEach((r) => {
    if (map[r.country] !== undefined) map[r.country] += 1;
  });
  return Object.entries(map).map(([name, total]) => ({ name, total }));
}

function aggregateCrops(rows) {
  const map = {};
  rows.forEach((r) => {
    (r.crops || []).forEach((c) => {
      map[c] = (map[c] || 0) + 1;
    });
  });
  return Object.entries(map)
    .map(([crop, count]) => ({ crop, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function PasswordGate({ onUnlock }) {
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const expected = import.meta.env.VITE_ADMIN_DASHBOARD_PASSWORD;

  const submit = (e) => {
    e.preventDefault();
    if (!expected) {
      setErr('Mot de passe non configuré (VITE_ADMIN_DASHBOARD_PASSWORD).');
      return;
    }
    if (password === expected) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setErr('Mot de passe incorrect.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-brand-iconBg flex items-center justify-center">
            <Lock className="w-7 h-7 text-brand-forest" aria-hidden />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-brand-forest">Tableau données Supabase</h1>
        <p className="text-sm text-gray-600 text-center">Saisissez le mot de passe défini dans les variables d’environnement.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-sage"
          placeholder="Mot de passe"
          autoComplete="current-password"
          aria-label="Mot de passe administrateur données"
        />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button type="submit" className="w-full btn-primary">
          Accéder
        </button>
        <Link to="/" className="block text-center text-sm text-brand-sage hover:underline">
          Retour à l’accueil
        </Link>
      </form>
    </div>
  );
}

function DashboardContent() {
  const { data, error, isLoading, mutate } = useSWR(isSupabaseConfigured() ? 'farmers-all' : null, fetchFarmers, {
    refreshInterval: 60_000,
    revalidateOnFocus: true,
  });

  const byCountry = useMemo(() => aggregateByCountry(data || []), [data]);
  const byCrop = useMemo(() => aggregateCrops(data || []), [data]);
  const recent = useMemo(() => (data || []).slice(0, 10), [data]);

  useEffect(() => {
    const id = setInterval(() => mutate(), 60_000);
    return () => clearInterval(id);
  }, [mutate]);

  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-700 max-w-md text-center">
          Supabase n’est pas configuré. Ajoutez <code className="bg-gray-100 px-1">VITE_SUPABASE_URL</code> et{' '}
          <code className="bg-gray-100 px-1">VITE_SUPABASE_ANON_KEY</code> puis reconstruisez l’application.
        </p>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-sage" aria-label="Chargement" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-lg text-red-800">
          <p className="font-semibold mb-2">Erreur de chargement</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  const total = data?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-brand-forest" aria-hidden />
            <div>
              <h1 className="text-2xl font-bold text-brand-forest">Données agriculteurs (Supabase)</h1>
              <p className="text-sm text-gray-600">Actualisation automatique toutes les 60 secondes</p>
            </div>
          </div>
          <Link to="/admin/central" className="text-sm text-brand-sage hover:underline">
            ← Retour au tableau admin
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <p className="text-sm text-gray-500">Total inscrits</p>
            <p className="text-3xl font-bold text-brand-forest">{total}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100 md:col-span-2">
            <p className="text-sm text-gray-500 mb-2">Carte (aperçu Sahel)</p>
            <div className="h-40 rounded-lg bg-gradient-to-br from-brand-forest/90 to-brand-sage/80 flex items-center justify-center text-white text-sm px-4 text-center">
              Mali · Burkina Faso · Niger — zones couvertes par le projet PTASS (carte interactive à venir)
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-brand-forest mb-4">Agriculteurs par pays</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCountry} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#52B788" name="Inscriptions" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 border border-gray-100">
            <h2 className="text-lg font-semibold text-brand-forest mb-4">Mentions par culture (top)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={byCrop} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="crop" width={72} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1B4332" name="Nombre" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <h2 className="text-lg font-semibold text-brand-forest p-4 border-b">Derniers enregistrements</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="p-3 font-medium">Nom</th>
                  <th className="p-3 font-medium">Région</th>
                  <th className="p-3 font-medium">Pays</th>
                  <th className="p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Aucun agriculteur enregistré pour le moment.
                    </td>
                  </tr>
                ) : (
                  recent.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                      <td className="p-3">{row.full_name}</td>
                      <td className="p-3">{row.region}</td>
                      <td className="p-3">{row.country}</td>
                      <td className="p-3 whitespace-nowrap">
                        {row.created_at ? new Date(row.created_at).toLocaleString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupabaseDataDashboard() {
  const expectedPwd = import.meta.env.VITE_ADMIN_DASHBOARD_PASSWORD;
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  if (!expectedPwd) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-amber-50">
        <p className="text-amber-900 max-w-lg text-center">
          Définissez <code className="bg-white px-1 rounded">VITE_ADMIN_DASHBOARD_PASSWORD</code> dans les variables
          d’environnement pour sécuriser ce tableau.
        </p>
      </div>
    );
  }

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <DashboardContent />;
}
