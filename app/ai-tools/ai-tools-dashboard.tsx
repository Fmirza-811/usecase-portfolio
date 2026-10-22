"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search } from 'lucide-react';

// AI tool tracker dashboard. Data comes from the Access Log tab of the AI tool
// tracker, imported into the portfolio Google Sheet, via /api/ai-tools. It has
// one row per person per tool. Columns are found by header name (FIELD_ALIASES)
// so they can be reordered or renamed slightly without breaking the page.
//
// As in the tracker's own Summary tab, only Approved and Active rows count
// towards seats and cost; a row with a Revoked Month no longer counts.

type TrackerData = { sheet: string | null; headers: string[]; rows: string[][] };

type FieldKey = 'tool' | 'user' | 'department' | 'cost' | 'status' | 'revoked';

// Matched in this order, alias by alias, at the start of a word, and a column is
// only used once.
const FIELD_ALIASES: Array<[FieldKey, string[]]> = [
  ['cost', ['monthly cost', 'cost', 'price', 'spend', 'amount']],
  ['revoked', ['revoked', 'removed']],
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

const STATUS_COLORS: Record<string, string> = {
  active: '#22A55C',
  approved: '#118BA1',
  requested: '#D98A00',
  revoked: '#A1A1A6',
  rejected: '#C4384A',
};
const statusColor = (status: string) => STATUS_COLORS[status.toLowerCase()] ?? '#A1A1A6';

// Seat bars split Active (solid) from Approved, not yet set up (light).
const ACTIVE_FILL = '#118BA1';
const APPROVED_FILL = '#9FD3DD';

type Bar = { label: string; value: number; active?: number };

function group(rows: string[][], keyIndex: number, valueOf: (row: string[]) => number, isActive?: (row: string[]) => boolean): Bar[] {
  const totals = new Map<string, Bar>();
  rows.forEach((row) => {
    const label = row[keyIndex] || 'Not set';
    const bar = totals.get(label) ?? { label, value: 0, active: 0 };
    bar.value += valueOf(row);
    if (isActive?.(row)) bar.active! += valueOf(row);
    totals.set(label, bar);
  });
  return [...totals.values()].filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
}

function BarList({ title, subtitle, items, format, split = false }: {
  title: string;
  subtitle: string;
  items: Bar[];
  format: (n: number) => string;
  split?: boolean;
}) {
  const max = Math.max(...items.map((b) => b.value), 1);
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-ink-tertiary">{subtitle}</p>
        </div>
        {split && (
          <div className="flex gap-3 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: ACTIVE_FILL }} />Active</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: APPROVED_FILL }} />Approved</span>
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-xs italic text-ink-tertiary">Nothing to show</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((b) => {
            const tip = split ? `${b.label}: ${format(b.value)} (${b.active ?? 0} active, ${b.value - (b.active ?? 0)} approved)` : `${b.label}: ${format(b.value)}`;
            return (
              <li key={b.label} className="group" title={tip}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate text-ink">{b.label}</span>
                  <span className="shrink-0 font-medium tabular-nums text-ink-secondary">{format(b.value)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-black/[0.04]">
                  <div className="flex h-2 gap-[2px] transition-opacity group-hover:opacity-80" style={{ width: `${(b.value / max) * 100}%` }}>
                    {split ? (
                      <>
                        {(b.active ?? 0) > 0 && <div className="h-2 rounded-full" style={{ background: ACTIVE_FILL, flexGrow: b.active }} />}
                        {b.value - (b.active ?? 0) > 0 && <div className="h-2 rounded-full" style={{ background: APPROVED_FILL, flexGrow: b.value - (b.active ?? 0) }} />}
                      </>
                    ) : (
                      <div className="h-2 flex-1 rounded-full" style={{ background: ACTIVE_FILL }} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
  const costOf = (r: string[]) => (cols.cost !== undefined ? toNumber(r[cols.cost]) : 0);
  const monthly = billable.reduce((sum, r) => sum + costOf(r), 0);
  const activeSeats = billable.filter(isActive).length;
  const people = cols.user !== undefined ? new Set(billable.map((r) => r[cols.user!].toLowerCase())).size : billable.length;
  const requested = rows.filter((r) => statusOf(r).toLowerCase() === 'requested');
  const requestedCost = requested.reduce((sum, r) => sum + costOf(r), 0);
  const seat = () => 1;

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
            No tracker found. Import <span className="font-medium text-ink">AI Tool Tracker_Org.xlsx</span> into the portfolio Google Sheet (File → Import → Insert new sheets) so it has an <span className="font-medium text-ink">Access Log</span> tab.
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

            <div className="grid items-start gap-4 md:grid-cols-2">
              {cols.tool !== undefined && cols.cost !== undefined && (
                <BarList title="Monthly cost by tool" subtitle="Approved + Active, USD" items={group(billable, cols.tool, costOf)} format={formatUsd} />
              )}
              {cols.department !== undefined && cols.cost !== undefined && (
                <BarList title="Monthly cost by department" subtitle="Approved + Active, USD" items={group(billable, cols.department, costOf)} format={formatUsd} />
              )}
              {cols.tool !== undefined && (
                <BarList title="Seats by tool" subtitle="Approved + Active" items={group(billable, cols.tool, seat, isActive)} format={formatNumber} split />
              )}
              {cols.department !== undefined && (
                <BarList title="Seats by department" subtitle="Approved + Active" items={group(billable, cols.department, seat, isActive)} format={formatNumber} split />
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
                            ) : (r[ci] || '—')}
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
