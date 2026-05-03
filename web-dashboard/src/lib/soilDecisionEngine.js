/**
 * Logique d’aide à la décision — diagnostic sol (zone sèche / tropicale, table de règles déterministe).
 */

const TEXTURE_BASE = {
  sableux: 52,
  limoneux: 82,
  argileux: 64,
  mixte: 74,
};

const COLOR_MOD = {
  noir: 10,
  rouge: 6,
  sableux: -6,
  argileux: 2,
};

const HUM_MOD = {
  tres_sec: -8,
  sec: -2,
  modere: 6,
  humide: 4,
};

/** Cultures par saison et texture (clé texture manquante → default) */
const SEASON_CROPS = {
  seche: {
    sableux: ['Sorgho', 'Mil', 'Arachide'],
    limoneux: ['Mil', 'Sorgho', 'Niébé'],
    argileux: ['Mil', 'Niébé', 'Sorgho'],
    mixte: ['Mil', 'Sorgho', 'Arachide'],
    default: ['Mil', 'Sorgho', 'Niébé'],
  },
  pluies: {
    sableux: ['Maïs', 'Arachide', 'Sorgho'],
    limoneux: ['Maïs', 'Riz', 'Sorgho'],
    argileux: ['Riz', 'Maïs', 'Niébé'],
    mixte: ['Maïs', 'Sorgho', 'Riz'],
    default: ['Maïs', 'Riz', 'Sorgho'],
  },
};

const LAST_CROP_HINT = {
  Mil: 'Rotation avec niébé ou arachide pour fixer l’azote.',
  Sorgho: 'Envisager le maïs ou le mil selon l’eau disponible.',
  Maïs: 'Bon antécédent pour cultures exigeantes ; surveiller l’azote.',
  Arachide: 'Enrichit le sol ; cultures suivantes profitent du phosphore.',
  Coton: 'Sol souvent appauvri ; compost fortement recommandé.',
  Jachère: 'Bon point de départ ; cibler cultures adaptées à la texture.',
  Autre: 'Varier les familles de cultures pour limiter les bioagresseurs.',
};

function pickCrops(season, texture) {
  const s = season === 'pluies' ? 'pluies' : 'seche';
  const table = SEASON_CROPS[s];
  return table[texture] || table.default;
}

/**
 * @param {{
 *  soilColor: string,
 *  texture: string,
 *  humidity: string,
 *  country: string,
 *  region: string,
 *  season: string,
 *  lastCrop: string,
 * }} input
 */
export function computeSoilResult(input) {
  const { soilColor, texture, humidity, season, lastCrop } = input;

  let score =
    (TEXTURE_BASE[texture] ?? 65) +
    (COLOR_MOD[soilColor] ?? 0) +
    (HUM_MOD[humidity] ?? 0);

  if (texture === 'argileux' && humidity === 'humide') score -= 5;
  if (texture === 'sableux' && humidity === 'tres_sec') score -= 6;
  if (texture === 'limoneux' && humidity === 'modere') score += 4;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const pool = pickCrops(season, texture);

  const recommendedCrops = pool.slice(0, 3).map((name, i) => ({
    name,
    reason:
      i === 0
        ? 'Adaptée à votre texture et à la saison indiquée.'
        : i === 1
          ? 'Complémentaire pour la rotation et le marché local.'
          : 'Bon compromis rendement / résilience climatique.',
  }));

  const amendments = buildAmendments(soilColor, texture, humidity);
  const practices = buildPractices(texture, humidity, season, lastCrop);

  return {
    fertilityScore: score,
    recommendedCrops,
    amendments,
    practices,
    lastCropHint: LAST_CROP_HINT[lastCrop] || LAST_CROP_HINT.Autre,
  };
}

function buildAmendments(soilColor, texture, humidity) {
  const out = [];
  if (texture === 'sableux') {
    out.push('Compost organique ou fumier bien décomposé (apports fractionnés).');
    out.push('Paillage pour limiter l’évaporation et le ruissellement.');
  }
  if (texture === 'argileux') {
    out.push('Amendements organiques pour désagglo et vie du sol.');
    if (humidity === 'humide' || humidity === 'modere') {
      out.push('Surveiller le drainage ; éviter le tassement en saison des pluies.');
    }
  }
  if (soilColor === 'rouge' || soilColor === 'argileux') {
    out.push('Apport ciblé de phosphore (sols latéritiques) selon analyse.');
  }
  if (soilColor === 'sableux') {
    out.push('Éviter l’urée seule sur sol très sableux : fractionner ou associer à du compost.');
  }
  if (humidity === 'tres_sec' || humidity === 'sec') {
    out.push('Engrais verts ou légumineuses en couverture pour retenir l’eau et l’azote.');
  }
  if (out.length < 2) {
    out.push('Analyse de sol tous les 2–3 ans pour ajuster NPK et microéléments.');
  }
  return [...new Set(out)].slice(0, 5);
}

function buildPractices(texture, humidity, season, lastCrop) {
  const out = [];
  out.push('Rotation avec légumineuses (niébé, arachide) pour restaurer l’azote.');
  if (texture === 'argileux') {
    out.push('Travail du sol modéré pour préserver la structure.');
  }
  if (texture === 'sableux') {
    out.push('Irrigation localisée ou au pié si disponible ; zonation des parcelles.');
  }
  if (season === 'seche') {
    out.push('Semis tôt ou variétés courtes pour échapper au pic de sécheresse.');
  } else {
    out.push('Gestion de l’excès d’eau : billons ou sillons selon la pente.');
  }
  if (lastCrop === 'Coton' || lastCrop === 'Maïs') {
    out.push('Compensation organique renforcée après culture exigeante.');
  }
  return [...new Set(out)].slice(0, 5);
}
