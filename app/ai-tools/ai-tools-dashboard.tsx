"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowDown, ArrowUp, ArrowUpDown, Loader2, RefreshCw, Search } from 'lucide-react';

// AI tool tracker dashboard. Data comes from the "AI Tools" tab of the Google
// Sheet via /api/ai-tools. The tab's columns aren't fixed, so each field the
// dashboard needs is matched to a column by its header name (see FIELD_ALIASES).

type TrackerData = { sheet: string | null; headers: string[]; rows: string[][] };

type FieldKey = 'tool' | 'user' | 'department' | 'cost' | 'seats' | 'plan' | 'status' | 'renewal';

// Matched in this order, alias by alias, at the start of a word, and a column is
// only used once, so more specific fields come first ("Cost per seat" is cost,
// "License type" is plan, not seats).
const FIELD_ALIASES: Array<[FieldKey, string[]]> = [
  ['cost', ['cost', 'price', 'spend', 'amount', 'fee', 'usd', 'pkr']],
  ['plan', ['plan', 'tier', 'edition', 'licence type', 'license type', 'subscription type']],
  ['seats', ['seats', 'no. of', 'number of', 'qty', 'quantity', 'licenses', 'licences', 'count']],
  ['renewal', ['renewal', 'expiry', 'expires', 'expiration', 'end date', 'valid till', 'valid until']],
  ['status', ['status', 'active']],
  ['department', ['department', 'dept', 'team', 'division', 'function', 'business unit']],
  ['tool', ['tool', 'application', 'software', 'platform', 'product', 'subscription', 'app']],
  ['user', ['user', 'employee', 'assigned', 'holder', 'owner', 'person', 'name', 'email']],
];

function detectColumns(headers: string[]): Partial<Record<FieldKey, number>> {
  const used = new Set<number>();
  const found: Partial<Record<FieldKey, number>> = {};
  for (const [field, aliases] of FIELD_ALIASES) {
    for (const alias of aliases) {
      const escaped = alias.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`(^|[^a-z])${escaped}`);
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

type Breakdown = { label: string; value: number };

function breakdown(rows: string[][], keyIndex: number, valueOf: (row: string[]) => number): Breakdown[] {
  const totals = new Map<string, number>();
  rows.forEach((row) => {
    const key = row[keyIndex] || 'Unassigned';
    totals.set(key, (totals.get(key) ?? 0) + valueOf(row));
  });
  return [...totals].map(([label, value]) => ({ label, value })).filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
}

function BarList({ title, subtitle, items, format, limit = 10 }: {
  title: string;
  subtitle: string;
  items: Breakdown[];
  format: (n: number) => string;
  limit?: number;
}) {
  const shown = items.slice(0, limit);
  const rest = items.slice(limit).reduce((sum, b) => sum + b.value, 0);
  const all = rest > 0 ? [...shown, { label: `Other (${items.length - limit})`, value: rest }] : shown;
  const max = Math.max(...all.map((b) => b.value), 1);
  return (
    <div className="rounded-2xl border border-hairline bg-white p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-ink-tertiary">{subtitle}</p>
      {all.length === 0 ? (
        <p className="mt-4 text-xs italic text-ink-tertiary">No data</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {all.map((b) => (
            <li key={b.label} className="group" title={`${b.label}: ${format(b.value)}`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="truncate text-ink">{b.label}</span>
                <span className="shrink-0 font-medium tabular-nums text-ink-secondary">{format(b.value)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/[0.04]">
                <div className="h-2 rounded-full bg-accent transition-opacity group-hover:opacity-80" style={{ width: `${(b.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ value, label, tone = 'text-ink' }: { value: string; label: string; tone?: string }) {
  return (
    <div className="bg-white px-4 py-4 sm:px-6 sm:py-5">
      <p className={`text-2xl font-bold leading-none tracking-tight sm:text-[34px] ${tone}`}>{value}</p>
      <p className="mt-2 text-sm text-ink-secondary">{label}</p>
    </div>
  );
}

const selectClass = 'h-11 w-full rounded-full border border-hairline bg-white px-4 text-sm text-ink outline-none focus:border-accent sm:w-[180px]';

export function AiToolsDashboard() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toolFilter, setToolFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
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
  const allRows = useMemo(() => data?.rows ?? [], [data]);
  const cols = useMemo(() => detectColumns(headers), [headers]);

  const [toolOptions, deptOptions] = useMemo(() => {
    const options = (index: number | undefined) =>
      index === undefined ? [] : [...new Set(allRows.map((r) => r[index]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    return [options(cols.tool), options(cols.department)];
  }, [allRows, cols]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter((r) =>
      (toolFilter === 'All' || (cols.tool !== undefined && r[cols.tool] === toolFilter)) &&
      (deptFilter === 'All' || (cols.department !== undefined && r[cols.department] === deptFilter)) &&
      (!q || r.some((v) => v.toLowerCase().includes(q))));
  }, [allRows, search, toolFilter, deptFilter, cols]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const { col, dir } = sort;
    const numeric = rows.every((r) => !r[col] || /^[^a-z]*\d[^a-z]*$/i.test(r[col]));
    return [...rows].sort((a, b) => {
      const cmp = numeric ? toNumber(a[col]) - toNumber(b[col]) : a[col].localeCompare(b[col]);
      return dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort]);

  // People with access: distinct names when there's a user column, otherwise the
  // sum of a seats / licences column, otherwise one per row.
  const peopleOf = (subset: string[][]) =>
    cols.user !== undefined
      ? new Set(subset.map((r) => r[cols.user!].toLowerCase()).filter(Boolean)).size
      : cols.seats !== undefined
        ? subset.reduce((sum, r) => sum + toNumber(r[cols.seats!]), 0)
        : subset.length;
  const peopleValue = (r: string[]) => (cols.user === undefined && cols.seats !== undefined ? toNumber(r[cols.seats]) : 1);
  const peopleLabel = cols.user !== undefined ? 'People with access' : cols.seats !== undefined ? 'Licences' : 'Assignments';
  const costLabel = cols.cost !== undefined ? headers[cols.cost] : '';
  const costOf = (r: string[]) => (cols.cost !== undefined ? toNumber(r[cols.cost]) : 0);

  const stats = {
    tools: cols.tool !== undefined ? new Set(rows.map((r) => r[cols.tool!]).filter(Boolean)).size : 0,
    people: peopleOf(rows),
    departments: cols.department !== undefined ? new Set(rows.map((r) => r[cols.department!]).filter(Boolean)).size : 0,
    cost: rows.reduce((sum, r) => sum + costOf(r), 0),
  };

  const toggleSort = (col: number) =>
    setSort((s) => (s?.col !== col ? { col, dir: 'asc' } : s.dir === 'asc' ? { col, dir: 'desc' } : null));

  const filtersActive = search !== '' || toolFilter !== 'All' || deptFilter !== 'All';

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
            Which AI tools NETSOL pays for, who has them, which departments use them and what they cost.
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
            No tracker tab found. Add a tab named <span className="font-medium text-ink">AI Tools</span> to the portfolio Google Sheet and paste the tracker into it, with the column headers in the first row.
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline ${cols.cost !== undefined ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <Stat value={formatNumber(stats.tools)} label="AI tools" tone="text-accent" />
              <Stat value={formatNumber(stats.people)} label={peopleLabel} />
              <Stat value={formatNumber(stats.departments)} label="Departments" />
              {cols.cost !== undefined && <Stat value={formatNumber(stats.cost)} label={`Total · ${costLabel}`} tone="text-[#22A55C]" />}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-4 sm:flex-row md:p-5">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tools, people, departments…" className="h-11 w-full rounded-full border border-hairline bg-white pl-11 pr-4 text-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-accent" />
              </div>
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
              {filtersActive && (
                <button type="button" onClick={() => { setSearch(''); setToolFilter('All'); setDeptFilter('All'); }} className="h-11 shrink-0 rounded-full px-4 text-sm text-ink-secondary hover:text-ink">
                  Clear
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {cols.tool !== undefined && cols.cost !== undefined && (
                <BarList title="Cost by tool" subtitle={costLabel} items={breakdown(rows, cols.tool, costOf)} format={formatNumber} />
              )}
              {cols.department !== undefined && cols.cost !== undefined && (
                <BarList title="Cost by department" subtitle={costLabel} items={breakdown(rows, cols.department, costOf)} format={formatNumber} />
              )}
              {cols.tool !== undefined && (
                <BarList title={`${peopleLabel} by tool`} subtitle={cols.user !== undefined ? 'Assignments per tool' : peopleLabel} items={breakdown(rows, cols.tool, peopleValue)} format={formatNumber} />
              )}
              {cols.department !== undefined && (
                <BarList title={`${peopleLabel} by department`} subtitle={cols.user !== undefined ? 'Assignments per department' : peopleLabel} items={breakdown(rows, cols.department, peopleValue)} format={formatNumber} />
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
              <div className="flex items-baseline justify-between gap-3 border-b border-hairline px-5 py-3">
                <h3 className="text-sm font-semibold text-ink">All records</h3>
                <span className="text-xs text-ink-tertiary">{rows.length} of {allRows.length} rows · from the &ldquo;{data.sheet}&rdquo; tab</span>
              </div>
              <div className="max-h-[600px] overflow-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead className="sticky top-0 bg-[#FAFAFA]">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="whitespace-nowrap border-b border-hairline px-4 py-2.5 text-xs font-medium text-ink-secondary">
                          <button type="button" onClick={() => toggleSort(i)} className="inline-flex items-center gap-1 hover:text-ink">
                            {h}
                            {sort?.col === i ? (sort.dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((r, ri) => (
                      <tr key={ri} className="border-b border-hairline-soft last:border-0 hover:bg-[#FAFAFA]">
                        {r.map((v, ci) => (
                          <td key={ci} className={`px-4 py-2.5 align-top ${ci === cols.tool ? 'font-medium text-ink' : 'text-ink-secondary'} ${ci === cols.cost ? 'whitespace-nowrap tabular-nums' : ''}`}>{v || '—'}</td>
                        ))}
                      </tr>
                    ))}
                    {sortedRows.length === 0 && (
                      <tr><td colSpan={headers.length || 1} className="px-4 py-6 text-center text-xs italic text-ink-tertiary">No rows match these filters</td></tr>
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
