import { memo } from 'react';
import { Plus, Check } from 'lucide-react';
import { CROPS } from './constants';
import ListingCard from './ListingCard';

function ListingsTab({
  isFr,
  listings,
  showNewListing,
  setShowNewListing,
  listingForm,
  setListingForm,
  listingState,
  submitListing,
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-[#1a3c2e]">
            {isFr ? 'Ma production déclarée à la coopérative' : 'My Production Declared to Cooperative'}
          </h3>
          <p className="text-gray-500 text-sm mt-1">
            {isFr
              ? 'Ces données sont visibles par votre coopérative. La coopérative décide quoi lister sur AfriYield Exchange.'
              : 'This data is visible to your cooperative. The cooperative decides what to list on AfriYield Exchange.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNewListing(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-bold shrink-0"
          style={{ background: '#1a3c2e' }}
        >
          <Plus className="w-4 h-4" />
          {isFr ? 'Déclarer une production' : 'Declare production'}
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-3">🌾</div>
          <h3 className="text-lg font-bold text-[#1a3c2e] mb-2">
            {isFr ? 'Aucune production déclarée' : 'No production declared yet'}
          </h3>
          <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">
            {isFr
              ? 'Déclarez votre production disponible à votre coopérative. Elle vérifiera et pourra promouvoir l’offre sur AfriYield Exchange.'
              : 'Declare your available production to your cooperative. They will verify and can promote collective supply on AfriYield Exchange.'}
          </p>
          <button
            type="button"
            onClick={() => setShowNewListing(true)}
            className="px-5 py-2.5 rounded-xl font-bold text-white text-sm"
            style={{ background: '#1a3c2e' }}
          >
            + {isFr ? 'Déclarer ma première production' : 'Declare my first production'}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {listings.map((l) => (
            <ListingCard key={l._id} listing={l} isFr={isFr} />
          ))}
        </div>
      )}

      {showNewListing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl relative">
            <h3 className="font-bold text-[#1a3c2e] text-xl mb-1">
              🌾 {isFr ? 'Déclarer ma production disponible' : 'Declare Available Production'}
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {isFr
                ? 'Informez votre coopérative de votre production disponible. Votre coopérative vérifiera et listera sur AfriYield Exchange.'
                : 'Inform your cooperative of your available production. Your cooperative will verify and list on AfriYield Exchange.'}
            </p>
            {listingState.ok ? (
              <div className="text-center py-6">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-bold text-[#1a3c2e] mb-2">
                  {isFr ? 'Production déclarée !' : 'Production declared!'}
                </p>
                <p className="text-gray-500 text-sm">
                  {isFr
                    ? "Votre coopérative a été notifiée. Elle vérifiera et ajoutera votre production à l'offre collective sur AfriYield Exchange."
                    : 'Your cooperative has been notified. They will verify and add your production to the collective supply on AfriYield Exchange.'}
                </p>
              </div>
            ) : (
              <form onSubmit={submitListing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Produit' : 'Commodity'} *
                  </label>
                  <select
                    value={listingForm.commodity}
                    onChange={(e) => setListingForm((p) => ({ ...p, commodity: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                  >
                    {CROPS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Quantité (kg)' : 'Quantity (kg)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={listingForm.quantityKg}
                      onChange={(e) => setListingForm((p) => ({ ...p, quantityKg: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Prix/kg (USD)' : 'Price/kg (USD)'} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min={0}
                      value={listingForm.pricePerKgUSD}
                      onChange={(e) => setListingForm((p) => ({ ...p, pricePerKgUSD: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {isFr ? 'Certification' : 'Certification'}
                    </label>
                    <select
                      value={listingForm.certificationLevel}
                      onChange={(e) => setListingForm((p) => ({ ...p, certificationLevel: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    >
                      <option value="None">{isFr ? 'Aucune' : 'None'}</option>
                      <option value="Local">Local</option>
                      <option value="Regional">Regional (ECOWAS)</option>
                      <option value="International">International (EU/USDA)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{isFr ? 'Qualité' : 'Grade'}</label>
                    <select
                      value={listingForm.qualityGrade}
                      onChange={(e) => setListingForm((p) => ({ ...p, qualityGrade: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-[#1a3c2e]"
                    >
                      <option value="C">C</option>
                      <option value="B">B</option>
                      <option value="A">A</option>
                      <option value="Export Grade">Export Grade</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isFr ? 'Description (optionnel)' : 'Description (optional)'}
                  </label>
                  <textarea
                    value={listingForm.description}
                    onChange={(e) => setListingForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1a3c2e] resize-none"
                  />
                </div>
                {listingState.err && (
                  <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{listingState.err}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={listingState.loading}
                    className="flex-1 rounded-xl py-3 font-bold text-white text-sm disabled:opacity-50"
                    style={{ background: '#1a3c2e' }}
                  >
                    {listingState.loading ? '...' : isFr ? 'Déclarer à ma coopérative' : 'Submit to my cooperative'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewListing(false)}
                    className="px-5 rounded-xl border border-gray-200 text-gray-500 text-sm"
                  >
                    {isFr ? 'Annuler' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ListingsTab);
