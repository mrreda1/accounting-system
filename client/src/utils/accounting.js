export function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function inferTypeFromCode(code) {
  const map = {
    1: 'asset',
    2: 'liability',
    3: 'equity',
    4: 'revenue',
    5: 'expense',
  };

  return map[String(code || '')[0]] || null;
}

export function getNormalSide(type) {
  if (type === 'asset' || type === 'expense') return 'Debit';
  if (type === 'liability' || type === 'equity' || type === 'revenue') return 'Credit';
  return 'N/A';
}

export function getAccountLayer(code) {
  const digits = String(code || '').replace(/\D/g, '');

  if (!digits) return 0;
  if (digits.length <= 1) return 1;
  if (digits.length <= 3) return 2;
  if (digits.length <= 6) return 3;
  if (digits.length <= 9) return 4;

  return 5;
}

export function compareCode(a, b) {
  return String(a.code).localeCompare(String(b.code), undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}
