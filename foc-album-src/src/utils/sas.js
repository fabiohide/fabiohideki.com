import { HOUSE_NAME_TO_CODE } from './validation.js';

const EXPANSION_MAP = {
  'CALL_OF_THE_ARCHONS': 'COTA',
  'AGE_OF_ASCENSION': 'AOA',
  'WORLDS_COLLIDE': 'WC',
  'MASS_MUTATION': 'MM',
  'DARK_TIDINGS': 'DT',
  'WINDS_OF_EXCHANGE': 'WOE',
  'GRIM_REMINDERS': 'GR',
  'AEMBER_SKIES': 'AS',
  'MORE_MUTATION': 'MOM',
  'TOKENS_OF_CHANGE': 'TOC',
  'UNCHAINED_2022': 'UNC',
  'VAULT_MASTERS_2023': 'VM23',
  'VAULT_MASTERS_2024': 'VM24',
  'VAULT_MASTERS_2025': 'VM25'
};

export function parseDokResponse(data) {
  if (!data || !data.deck) {
    throw new Error('Formato de resposta inválido do DoK.');
  }
  const deck = data.deck;
  const name = deck.name;
  const sas = Number(deck.sasRating);
  
  // Map verbose expansion name (e.g., MORE_MUTATION) to standard code (e.g., MOM)
  const rawExpansion = deck.expansion || 'COTA';
  const expansion = EXPANSION_MAP[rawExpansion.toUpperCase()] || rawExpansion;
  
  let houses = [];
  if (Array.isArray(deck.houses)) {
    houses = deck.houses.map(h => {
      if (typeof h === 'string') return h;
      if (h && typeof h === 'object') return h.name || h.house || '';
      return '';
    }).filter(Boolean);
  } else if (Array.isArray(deck.housesAndCards)) {
    houses = deck.housesAndCards.map(hc => hc.house).filter(Boolean);
  }
  
  const houseCodes = houses.map(name => {
    const clean = name.toLowerCase().replace(/\s+/g, '').trim();
    return HOUSE_NAME_TO_CODE[clean] || null;
  }).filter(Boolean);

  return {
    name,
    sas,
    expansion,
    houses: houseCodes
  };
}

export function getSasBadgeData(sas) {
  const target = 86;
  const diff = sas - target;
  let diffStr = `${diff}`;
  if (diff > 0) {
    diffStr = `+${diff}`;
  }
  
  let colorClass = 'sas-red';
  if (sas >= 82) {
    colorClass = 'sas-green';
  } else if (sas >= 77) {
    colorClass = 'sas-yellow';
  }
  
  return {
    diff,
    diffStr,
    colorClass
  };
}
