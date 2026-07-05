export const HOUSE_NAME_TO_CODE = {
  'brobnar': 'BRB',
  'dis': 'DIS',
  'logos': 'LGS',
  'mars': 'MRS',
  'sanctum': 'SCT',
  'redemption': 'RDP',
  'shadows': 'SHW',
  'untamed': 'UNT',
  'saurian': 'SAU',
  'star alliance': 'STA',
  'unfathomable': 'UNF',
  'ekwidon': 'EKW',
  'geistoid': 'GST',
  'skyborn': 'SKB'
};

export function validateScore(myKeys, oppKeys, isAdmin = false) {
  const mk = Number(myKeys);
  const ok = Number(oppKeys);

  if (isNaN(mk) || isNaN(ok)) {
    return { valid: false, message: 'Os placares devem ser numéricos.' };
  }

  if (mk < 0 || mk > 3 || ok < 0 || ok > 3) {
    return { valid: false, message: 'As chaves devem estar entre 0 e 3.' };
  }

  if (mk === 0 && ok === 0) {
    if (isAdmin) {
      return { valid: true, isWO: true };
    } else {
      return { valid: false, message: 'W.O. (0x0) é exclusivo para administradores.' };
    }
  }

  if (mk === ok) {
    return { valid: false, message: 'Não são permitidos empates.' };
  }

  const hasWinner3 = (mk === 3 || ok === 3);
  if (!hasWinner3) {
    return { valid: false, message: 'O vencedor deve ter exatamente 3 chaves.' };
  }

  const loserKeys = mk === 3 ? ok : mk;
  if (loserKeys < 0 || loserKeys > 2) {
    return { valid: false, message: 'O perdedor deve ter entre 0 e 2 chaves.' };
  }

  return { valid: true, isWO: false };
}
