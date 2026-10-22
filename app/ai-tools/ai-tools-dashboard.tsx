"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search } from 'lucide-react';

// AI tool tracker dashboard. Data comes from the Access Log tab of the portfolio
// Google Sheet via /api/ai-tools. It has one row per person per tool. Columns
// are found by header name (FIELD_ALIASES) so they can be reordered or renamed
// slightly without breaking the page.
//
// As in the tracker's own Summary tab, only Approved and Active rows count
// towards seats and cost; a row with a Revoked Month no longer counts. The
// department cost chart counts Active licences only, and activations per month
// come from the Access Month column (returned by the API as YYYY-MM-DD).

type TrackerData = { sheet: string | null; headers: string[]; rows: string[][] };

type FieldKey = 'tool' | 'user' | 'department' | 'cost' | 'status' | 'revoked' | 'started';

// Matched in this order, alias by alias, at the start of a word, and a column is
// only used once.
const FIELD_ALIASES: Array<[FieldKey, string[]]> = [
  ['cost', ['monthly cost', 'cost', 'price', 'spend', 'amount']],
  ['revoked', ['revoked', 'removed']],
  ['started', ['access month', 'activated', 'start']],
  ['status', ['status']],
  ['department', ['department', 'dept', 'team']],
  ['tool', ['tool', 'application', 'software', 'platform']],
  ['user', ['name', 'user', 'employee', 'person', 'email']],
];

function detectColumns(headers: string[]): Partial<Record<FieldKey, number>> {
  const used = new Set<number>();
  const found: Partial<Record<FieldKey, number>> = {};
  for (const [field, aliases] of FIELD_ALIASES) {
    for (const alias of aliases) {
      const pattern = new RegExp(`(^|[^a-z])${alias}`);
      const index = headers.findIndex((h, i) => !used.has(i) && pattern.test(h.toLowerCase()));
      if (index !== -1) { found[field] = index; used.add(index); break; }
    }
  }
  return found;
}

function toNumber(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

const formatNumber = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 });
const formatUsd = (n: number) => `$${formatNumber(n)}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const isoMonth = (value: string) => /^\d{4}-\d{2}/.exec(value)?.[0];
const formatMonth = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`;

// Every month from the first to the last given, so empty months show as zero.
function monthRange(months: string[]): string[] {
  if (months.length === 0) return [];
  const sorted = [...months].sort();
  const out: string[] = [];
  let [y, m] = sorted[0].split('-').map(Number);
  const last = sorted[sorted.length - 1];
  while (out.length < 120) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    out.push(ym);
    if (ym >= last) break;
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22A55C',
  approved: '#118BA1',
  requested: '#D98A00',
  revoked: '#A1A1A6',
  rejected: '#C4384A',
};
const statusColor = (status: string) => STATUS_COLORS[status.toLowerCase()] ?? '#A1A1A6';

// Tool colours, assigned in a fixed order by how many rows each tool has in the
// whole log, so a tool keeps its colour when filters change. Tools past the
// fifth fold into "Other".
const TOOL_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#6250d6'];
const OTHER_COLOR = '#A1A1A6';

type Slice = { label: string; value: number; color: string };

function sum(rows: string[][], keyIndex: number, valueOf: (row: string[]) => number): Map<string, number> {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const key = row[keyIndex] || 'Not set';
    totals.set(key, (totals.get(key) ?? 0) + valueOf(row));
  });
  return totals;
}

function ChartCard({ title, subtitle, className = '', children }: { title: string; subtitle: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex min-w-0 flex-col rounded-2xl border border-hairline bg-white p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-ink-tertiary">{subtitle}</p>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

const Empty = () => <p className="m-auto text-xs italic text-ink-tertiary">Nothing to show</p>;

function Donut({ slices, format, centerLabel }: { slices: Slice[]; format: (n: number) => string; centerLabel: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const shown = slices.filter((s) => s.value > 0);
  const total = shown.reduce((t, s) => t + s.value, 0);
  if (total === 0) return <Empty />;

  const r = 60;
  const circumference = 2 * Math.PI * r;
  const gap = shown.length > 1 ? 2 : 0;
  const lengths = shown.map((s) => (s.value / total) * circumference);
  const starts = lengths.map((_, i) => lengths.slice(0, i).reduce((t, l) => t + l, 0));
  const active = shown.find((s) => s.label === hover);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={shown.map((s) => `${s.label} ${format(s.value)}`).join(', ')}>
          <circle cx="80" cy="80" r={r} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="22" />
          {shown.map((s, i) => (
              <circle
                key={s.label}
                cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth={hover === s.label ? 26 : 22}
                strokeDasharray={`${Math.max(lengths[i] - gap, 0.5)} ${circumference}`} strokeDashoffset={-starts[i]}
                opacity={hover && hover !== s.label ? 0.35 : 1}
                className="cursor-pointer transition-[opacity,stroke-width]"
                onMouseEnter={() => setHover(s.label)} onMouseLeave={() => setHover(null)}
              >
                <title>{`${s.label}: ${format(s.value)} (${Math.round((s.value / total) * 100)}%)`}</title>
              </circle>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight text-ink">{format(active ? active.value : total)}</span>
          <span className="max-w-[90px] truncate text-[11px] text-ink-tertiary">{active ? active.label : centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-1">
        {shown.map((s) => (
          <li
            key={s.label}
            onMouseEnter={() => setHover(s.label)} onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition ${hover === s.label ? 'bg-black/[0.04]' : ''}`}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
            <span className="tabular-nums text-ink-secondary">{format(s.value)}</span>
            <span className="w-9 text-right tabular-nums text-ink-tertiary">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Columns({ items, format }: { items: Array<{ label: string; value: number; tip?: string }>; format: (n: number) => string }) {
  if (items.length === 0) return <Empty />;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div className="flex min-h-[200px] flex-1 flex-col">
      <div className="flex flex-1 items-end gap-2 border-b border-hairline sm:gap-3">
        {items.map((i) => (
          <div key={i.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end" title={i.tip ?? `${i.label}: ${format(i.value)}`}>
            <span className={`mb-1 text-[11px] font-medium tabular-nums ${i.value ? 'text-ink-secondary' : 'text-ink-tertiary'}`}>{format(i.value)}</span>
            <div className="w-full max-w-[44px] rounded-t-[4px] bg-accent transition-opacity group-hover:opacity-80" style={{ height: `${(i.value / max) * 85}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 sm:gap-3">
        {items.map((i) => (
          <span key={i.label} className="min-w-0 flex-1 truncate text-center text-[11px] text-ink-secondary" title={i.label}>{i.label}</span>
        ))}
      </div>
    </div>
  );
}

// Seats per tool (rows) and department (columns), shaded on one teal ramp.
function Matrix({ rows, toolIndex, deptIndex, tools, colorOf }: {
  rows: string[][];
  toolIndex: number;
  deptIndex: number;
  tools: string[];
  colorOf: (tool: string) => string;
}) {
  const depts = [...sum(rows, deptIndex, () => 1)].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  const toolList = tools.filter((t) => rows.some((r) => r[toolIndex] === t));
  if (toolList.length === 0) return <Empty />;
  const count = (t: string, d: string) => rows.filter((r) => r[toolIndex] === t && (r[deptIndex] || 'Not set') === d).length;
  const max = Math.max(...toolList.flatMap((t) => depts.map((d) => count(t, d))), 1);
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th />
            {depts.map((d) => <th key={d} className="whitespace-nowrap px-1 pb-1 text-center font-medium text-ink-secondary">{d}</th>)}
            <th className="px-2 pb-1 text-right font-medium text-ink-secondary">Total</th>
          </tr>
        </thead>
        <tbody>
          {toolList.map((t) => {
            const total = depts.reduce((n, d) => n + count(t, d), 0);
            return (
              <tr key={t}>
                <th className="whitespace-nowrap pr-3 text-left font-medium text-ink">
                  <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(t) }} />{t}</span>
                </th>
                {depts.map((d) => {
                  const n = count(t, d);
                  const strength = n / max;
                  return (
                    <td
                      key={d}
                      title={`${t} · ${d}: ${n} seat${n === 1 ? '' : 's'}`}
                      className="h-10 min-w-[44px] rounded-md text-center font-semibold tabular-nums"
                      style={n ? { background: `rgba(17, 139, 161, ${0.12 + 0.88 * strength})`, color: strength > 0.45 ? '#fff' : '#0A6A82' } : { background: 'rgba(0,0,0,0.025)', color: '#A1A1A6' }}
                    >
                      {n || '·'}
                    </td>
                  );
                })}
                <td className="px-2 text-right font-semibold tabular-nums text-ink">{total}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Stat({ value, label, detail, tone = 'text-ink' }: { value: string; label: string; detail?: string; tone?: string }) {
  return (
    <div className="bg-white px-4 py-4 sm:px-6 sm:py-5">
      <p className={`text-2xl font-bold leading-none tracking-tight sm:text-[34px] ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-ink-secondary">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-ink-tertiary">{detail}</p>}
    </div>
  );
}

const selectClass = 'h-11 w-full rounded-full border border-hairline bg-white px-4 text-sm text-ink outline-none focus:border-accent sm:w-[170px]';

export function AiToolsDashboard() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toolFilter, setToolFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sort, setSort] = useState<{ col: number; dir: 'asc' | 'desc' } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai-tools');
      if (!res.ok) throw new Error('Load failed');
      setData(await res.json());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const headers = useMemo(() => data?.headers ?? [], [data]);
  const cols = useMemo(() => detectColumns(headers), [headers]);
  // Rows without a name or a tool are blank template rows (the # column is pre-filled).
  const allRows = useMemo(
    () => (data?.rows ?? []).filter((r) => (cols.user !== undefined && r[cols.user]) || (cols.tool !== undefined && r[cols.tool])),
    [data, cols],
  );
  // Columns that are empty in every row (e.g. an unused Plan column) are left out of the table.
  const visibleCols = useMemo(() => headers.map((_, i) => i).filter((i) => allRows.some((r) => r[i])), [headers, allRows]);

  const statusOf = useCallback((r: string[]) => (cols.status !== undefined ? r[cols.status] : ''), [cols]);
  const isBillable = useCallback((r: string[]) => {
    if (cols.revoked !== undefined && r[cols.revoked]) return false;
    if (cols.status === undefined) return true;
    return ['approved', 'active'].includes(r[cols.status].toLowerCase());
  }, [cols]);
  const isActive = useCallback((r: string[]) => statusOf(r).toLowerCase() === 'active', [statusOf]);

  // Tools ordered by row count across the whole log; fixes each tool's colour.
  const toolOrder = useMemo(
    () => (cols.tool === undefined ? [] : [...sum(allRows, cols.tool, () => 1)].sort((a, b) => b[1] - a[1]).map(([t]) => t)),
    [allRows, cols],
  );

  const [toolOptions, deptOptions, statusOptions] = useMemo(() => {
    const options = (index: number | undefined) =>
      index === undefined ? [] : [...new Set(allRows.map((r) => r[index]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return [options(cols.tool), options(cols.department), options(cols.status)];
  }, [allRows, cols]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) =>
      (toolFilter === 'All' || r[cols.tool!] === toolFilter) &&
      (deptFilter === 'All' || r[cols.department!] === deptFilter) &&
      (statusFilter === 'All' || r[cols.status!] === statusFilter) &&
      (!q || r.some((v) => v.toLowerCase().includes(q))));
  }, [allRows, search, toolFilter, deptFilter, statusFilter, cols]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { col, dir } = sort;
    const numeric = rows.every((r) => !r[col] || /^[^a-z]*\d[^a-z]*$/i.test(r[col]));
    return [...rows].sort((a, b) => {
      const cmp = numeric ? toNumber(a[col]) - toNumber(b[col]) : a[col].localeCompare(b[col]);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  const billable = rows.filter(isBillable);
  const activeRows = billable.filter(isActive);

  // Licences made active per month: Active rows, plus Revoked ones (they were
  // active once), counted in their Access Month.
  const activated = rows.filter((r) => ['active', 'revoked'].includes(statusOf(r).toLowerCase()));
  const activationMonths = cols.started === undefined ? [] : activated.map((r) => isoMonth(r[cols.started!])).filter((m): m is string => !!m);
  const undatedActivations = activated.length - activationMonths.length;
  let runningTotal = 0;
  const activations = monthRange(activationMonths).map((ym) => {
    const value = activationMonths.filter((m) => m === ym).length;
    runningTotal += value;
    return { label: formatMonth(ym).replace(/ 20(\d\d)$/, " '$1"), value, tip: `${formatMonth(ym)}: ${value} activated · ${runningTotal} active by then` };
  });
  const costOf = (r: string[]) => (cols.cost !== undefined ? toNumber(r[cols.cost]) : 0);
  const monthly = billable.reduce((sum, r) => sum + costOf(r), 0);
  const activeSeats = billable.filter(isActive).length;
  const people = cols.user !== undefined ? new Set(billable.map((r) => r[cols.user!].toLowerCase())).size : billable.length;
  const requested = rows.filter((r) => statusOf(r).toLowerCase() === 'requested');
  const requestedCost = requested.reduce((sum, r) => sum + costOf(r), 0);

  const toolColor = (tool: string) => TOOL_COLORS[toolOrder.indexOf(tool)] ?? OTHER_COLOR;
  const toolSlices = (valueOf: (r: string[]) => number): Slice[] => {
    const totals = sum(billable, cols.tool!, valueOf);
    const named = toolOrder.slice(0, TOOL_COLORS.length).map((label) => ({ label, value: totals.get(label) ?? 0, color: toolColor(label) }));
    const other = [...totals].filter(([t]) => !named.some((n) => n.label === t)).reduce((n, [, v]) => n + v, 0);
    return [...named, { label: 'Other', value: other, color: OTHER_COLOR }].sort((a, b) => b.value - a.value);
  };

  const toggleSort = (col: number) =>
    setSort((s) => (s?.col !== col ? { col, dir: 'asc' } : s.dir === 'asc' ? { col, dir: 'desc' } : null));

  const filtersActive = search !== '' || toolFilter !== 'All' || deptFilter !== 'All' || statusFilter !== 'All';
  const clearFilters = () => { setSearch(''); setToolFilter('All'); setDeptFilter('All'); setStatusFilter('All'); };

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Image src="/transcend-logo.png" alt="Transcend AI Labs" width={381} height={134} priority className="h-7 w-auto" />
          <div className="flex items-center gap-2">
            <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-white px-4 text-sm font-medium text-ink hover:bg-[#FAFAFA]">
              <ArrowLeft className="h-4 w-4" /> Use cases
            </Link>
            <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-hairline bg-white text-ink hover:bg-[#FAFAFA] disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-accent md:text-[40px]">AI Tool Tracker</h1>
          <p className="mt-2 max-w-xl text-base leading-6 text-ink-secondary">
            Who has which AI tools, across which departments, and what it costs each month.
          </p>
        </div>

        {loading && !data ? (
          <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-white p-6 text-sm text-ink-secondary">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tracker…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-hairline bg-white p-6 text-sm text-[#C4384A]">Couldn&apos;t load the AI tool tracker. Please try refreshing.</div>
        ) : !data?.sheet ? (
          <div className="rounded-2xl border border-hairline bg-white p-6 text-sm text-ink-secondary">
            No <span className="font-medium text-ink">Access Log</span> tab found in the portfolio Google Sheet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline md:grid-cols-3 xl:grid-cols-5">
              <Stat value={formatUsd(monthly)} label="Monthly cost" detail="Approved + Active, USD" tone="text-[#22A55C]" />
              <Stat value={formatUsd(monthly * 12)} label="Annualised cost" detail="Monthly × 12" />
              <Stat value={formatNumber(billable.length)} label="Seats" detail={`${activeSeats} active · ${billable.length - activeSeats} approved`} tone="text-accent" />
              <Stat value={formatNumber(people)} label="People with access" />
              <Stat value={formatNumber(requested.length)} label="Open requests" detail={requested.length ? `${formatUsd(requestedCost)}/month if approved` : undefined} tone={requested.length ? 'text-[#D98A00]' : 'text-ink-tertiary'} />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-4 md:p-5 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people, roles, tools, departments…" className="h-11 w-full rounded-full border border-hairline bg-white pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-accent" />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {cols.tool !== undefined && (
                  <select value={toolFilter} onChange={(e) => setToolFilter(e.target.value)} className={selectClass} aria-label="Filter by tool">
                    <option value="All">All tools</option>
                    {toolOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {cols.department !== undefined && (
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={selectClass} aria-label="Filter by department">
                    <option value="All">All departments</option>
                    {deptOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {cols.status !== undefined && (
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass} aria-label="Filter by status">
                    <option value="All">All statuses</option>
                    {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {filtersActive && (
                  <button type="button" onClick={clearFilters} className="h-11 shrink-0 rounded-full px-4 text-sm text-ink-secondary hover:text-ink">Clear</button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {cols.tool !== undefined && cols.cost !== undefined && (
                <ChartCard title="Monthly cost by tool" subtitle="Approved + Active, USD">
                  <Donut slices={toolSlices(costOf)} format={formatUsd} centerLabel="per month" />
                </ChartCard>
              )}
              {cols.status !== undefined && (
                <ChartCard title="Access by status" subtitle="Every row in the log">
                  <Donut
                    slices={[...sum(rows, cols.status, () => 1)].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, color: statusColor(label) }))}
                    format={formatNumber}
                    centerLabel="in the log"
                  />
                </ChartCard>
              )}
              {cols.department !== undefined && cols.cost !== undefined && (
                <ChartCard title="Monthly cost by department" subtitle="Active licences only, USD" className="md:col-span-2">
                  <Columns items={[...sum(activeRows, cols.department, costOf)].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)} format={formatUsd} />
                </ChartCard>
              )}
              {cols.started !== undefined && (
                <ChartCard
                  title="Licences activated per month"
                  subtitle={`By Access Month${undatedActivations ? ` · ${undatedActivations} active without a month` : ''}`}
                  className="md:col-span-2"
                >
                  <Columns items={activations} format={formatNumber} />
                </ChartCard>
              )}
              {cols.tool !== undefined && cols.department !== undefined && (
                <ChartCard title="Who uses what" subtitle="Seats by tool and department, Approved + Active" className="md:col-span-2">
                  <Matrix rows={billable} toolIndex={cols.tool} deptIndex={cols.department} tools={toolOrder} colorOf={toolColor} />
                </ChartCard>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-hairline px-5 py-3">
                <h3 className="text-sm font-semibold text-ink">Access log</h3>
                <span className="text-xs text-ink-tertiary">{rows.length} of {allRows.length} rows · from the &ldquo;{data.sheet}&rdquo; tab</span>
              </div>
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full min-w-[720px] text-left text-[13px]">
                  <thead className="sticky top-0 z-10 bg-[#FAFAFA]">
                    <tr>
                      {visibleCols.map((i) => (
                        <th key={i} className="whitespace-nowrap border-b border-hairline px-4 py-2.5 text-xs font-medium text-ink-secondary">
                          <button type="button" onClick={() => toggleSort(i)} className="inline-flex items-center gap-1 hover:text-ink">
                            {headers[i]}
                            {sort?.col === i ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, ri) => (
                      <tr key={ri} className="border-b border-hairline-soft last:border-0 hover:bg-[#FAFAFA]">
                        {visibleCols.map((ci) => (
                          <td key={ci} className={`px-4 py-2.5 align-top ${ci === cols.user ? 'whitespace-nowrap font-medium text-ink' : 'text-ink-secondary'} ${ci === cols.cost ? 'whitespace-nowrap tabular-nums' : ''}`}>
                            {ci === cols.status && r[ci] ? (
                              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink">
                                <span className="h-2 w-2 rounded-full" style={{ background: statusColor(r[ci]) }} />
                                {r[ci]}
                              </span>
                            ) : ci === cols.started && isoMonth(r[ci]) ? formatMonth(isoMonth(r[ci])!) : (r[ci] || '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {sortedRows.length === 0 && (
                      <tr><td colSpan={visibleCols.length || 1} className="px-4 py-6 text-center text-xs italic text-ink-tertiary">No rows match these filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
