export function formatMoney(value) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function inferTypeFromCode(code) {
  const map = {
    1: 'asset',
    2: 'liability and equity',
    3: 'expense',
    4: 'revenue',
  };

  return map[String(code || '')[0]] || null;
}

export function getNormalSide(type) {
  if (type === 'asset' || type === 'expense') return 'Debit';
  if (type === 'liability and equity' || type === 'revenue') return 'Credit';
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

export function flattenAccountTree(nodes = []) {
  const result = [];

  const walk = (node) => {
    result.push(node);
    const children = node.children || node.sub_accounts || [];
    children.forEach(walk);
  };

  nodes.forEach(walk);
  return result;
}
