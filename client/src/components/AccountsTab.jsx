import { useEffect, useMemo, useState } from 'react';
import { getTrialBalance, postAccount } from '../services/api';
import {
  compareCode,
  formatMoney,
  getAccountLayer,
  getNormalSide,
  inferTypeFromCode,
} from '../utils/accounting';

function AccountsTab() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', name: '' });

  async function loadAccounts() {
    try {
      const res = await getTrialBalance();
      setAccounts([...res.data.data].sort(compareCode));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  const assets = useMemo(
    () => accounts.filter((account) => account.type === 'asset'),
    [accounts],
  );

  const liabilitiesAndEquity = useMemo(
    () => accounts.filter((account) => account.type === 'liability' || account.type === 'equity'),
    [accounts],
  );

  const otherAccounts = useMemo(
    () => accounts.filter((account) => !['asset', 'liability', 'equity'].includes(account.type)),
    [accounts],
  );

  const inferredType = inferTypeFromCode(form.code);

  async function handleAddAccount(e) {
    e.preventDefault();

    if (!form.code.trim() || !form.name.trim()) {
      setError('Account code and account name are required.');
      return;
    }

    setSaving(true);
    try {
      await postAccount({ code: form.code.trim(), name: form.name.trim() });
      setForm({ code: '', name: '' });
      await loadAccounts();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Accounts</h2>
            <p className="text-sm text-slate-500" dir="auto">
              Expand each layer to drill down through hierarchy (example: الاصول - الاصول الثابتة - الأصول الثابتة - ثلاجات التبريد).
            </p>
          </div>
          <button
            onClick={loadAccounts}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-500 hover:text-teal-700"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={handleAddAccount} className="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_2fr_auto]">
          <input
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="Account ID (1, 101, 101001...)"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
          />
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Account Name"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? 'Saving...' : 'Add Account'}
          </button>
          <div className="text-xs text-slate-500 md:col-span-3">
            {inferredType
              ? `Type from code prefix: ${inferredType}`
              : 'Type will be inferred from first digit (1-5).'}
          </div>
        </form>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading accounts...</p>}
        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
      </div>

      {!loading && !error && (
        <div className="grid gap-6 xl:grid-cols-2">
          <AccountLayerTree
            title="Debit Layer - Assets"
            subtitle="Normal balance side: Debit"
            accounts={assets}
            accent="teal"
          />

          <AccountLayerTree
            title="Credit Layer - Liabilities & Equity"
            subtitle="Normal balance side: Credit"
            accounts={liabilitiesAndEquity}
            accent="amber"
          />

          <div className="xl:col-span-2">
            <AccountLayerTree
              title="Other Accounts"
              subtitle="Revenue and expense accounts used in net income"
              accounts={otherAccounts}
              accent="slate"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function AccountLayerTree({ title, subtitle, accounts, accent }) {
  const accentMap = {
    teal: 'from-teal-500/15 to-cyan-500/10 border-teal-200',
    amber: 'from-amber-500/15 to-orange-500/10 border-amber-200',
    slate: 'from-slate-500/10 to-slate-400/5 border-slate-200',
  };

  const { roots, expandableCodes } = useMemo(() => buildAccountTree(accounts), [accounts]);
  const [expandedCodes, setExpandedCodes] = useState(() => new Set());

  useEffect(() => {
    const defaults = new Set();
    roots.forEach((root) => {
      if (root.children.length > 0) {
        defaults.add(root.code);
      }
    });
    setExpandedCodes(defaults);
  }, [roots]);

  function toggleNode(code) {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const rows = useMemo(() => {
    return renderTreeRows({
      nodes: roots,
      depth: 0,
      expandedCodes,
      onToggle: toggleNode,
    });
  }, [roots, expandedCodes]);

  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${accentMap[accent]}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedCodes(new Set(expandableCodes))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
          >
            Expand all
          </button>
          <button
            onClick={() => setExpandedCodes(new Set())}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-500 hover:text-rose-700"
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white/85">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Layer</th>
              <th className="px-4 py-3">Side</th>
              <th className="px-4 py-3 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-5 text-center text-slate-400">
                  No accounts in this group yet.
                </td>
              </tr>
            )}

            {rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderTreeRows({ nodes, depth, expandedCodes, onToggle }) {
  const rows = [];

  nodes.forEach((account) => {
    const hasChildren = account.children.length > 0;
    const isExpanded = expandedCodes.has(account.code);
    const balance =
      account.type === 'asset' || account.type === 'expense'
        ? Number(account.total_debit) - Number(account.total_credit)
        : Number(account.total_credit) - Number(account.total_debit);

    rows.push(
      <tr key={account.code} className="border-b border-slate-100 text-slate-700 hover:bg-slate-50/70">
        <td className="px-4 py-3 font-mono text-xs text-slate-500">{account.code}</td>
        <td className="px-4 py-3 font-medium text-slate-800">
          <div className="flex items-center gap-2" style={{ paddingInlineStart: `${depth * 1.2}rem` }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => onToggle(account.code)}
                className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 bg-white text-xs text-slate-600 transition hover:border-teal-500 hover:text-teal-700"
                aria-label={isExpanded ? 'Collapse layer' : 'Expand layer'}
                title={isExpanded ? 'Collapse layer' : 'Expand layer'}
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="inline-block h-5 w-5" />
            )}
            <span dir="auto" className="leading-6">{account.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">Layer {getAccountLayer(account.code)}</td>
        <td className="px-4 py-3">{getNormalSide(account.type)}</td>
        <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatMoney(balance)}</td>
      </tr>,
    );

    if (hasChildren && isExpanded) {
      rows.push(
        ...renderTreeRows({
          nodes: account.children,
          depth: depth + 1,
          expandedCodes,
          onToggle,
        }),
      );
    }
  });

  return rows;
}

function buildAccountTree(accounts) {
  const nodesByCode = new Map();

  accounts.forEach((account) => {
    const code = String(account.code);
    nodesByCode.set(code, {
      ...account,
      code,
      children: [],
    });
  });

  const roots = [];

  nodesByCode.forEach((node) => {
    const parentCode = getParentCode(node.code);
    const parent = parentCode ? nodesByCode.get(parentCode) : null;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  sortNodesByCode(roots);

  const expandableCodes = [];
  collectExpandableCodes(roots, expandableCodes);

  return { roots, expandableCodes };
}

function collectExpandableCodes(nodes, result) {
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      result.push(node.code);
      collectExpandableCodes(node.children, result);
    }
  });
}

function sortNodesByCode(nodes) {
  nodes.sort(compareCode);
  nodes.forEach((node) => {
    if (node.children.length > 0) {
      sortNodesByCode(node.children);
    }
  });
}

function getParentCode(code) {
  const digits = String(code || '').replace(/\D/g, '');

  if (digits.length <= 1) return null;
  if (digits.length <= 3) return digits.slice(0, 1);
  if (digits.length <= 6) return digits.slice(0, 3);
  if (digits.length <= 9) return digits.slice(0, 6);

  return digits.slice(0, 9);
}

export default AccountsTab;
