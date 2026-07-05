import { HOUSE_NAME_TO_CODE } from './validation.js';

export function parseDokResponse(data) {
  if (!data || !data.deck) {
    throw new Error('Formato de resposta inválido do DoK.');
  }
  const deck = data.deck;
  const name = deck.name;
  const sas = Number(deck.sasRating);
  const expansion = deck.expansion || 'COTA';
  
  let houses = [];
  if (Array.isArray(deck.houses)) {
    houses = deck.houses.map(h => {
      if (typeof h === 'string') return h;
      if (h && typeof h === 'object') return h.name || h.house || '';
      return '';
    }).filter(Boolean);
  }
  
  const houseCodes = houses.map(name => {
    const clean = name.toLowerCase().trim();
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
