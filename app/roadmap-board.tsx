"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Pencil, X } from 'lucide-react';

// AI Labs Now / Next / Later roadmap. LANES below holds the default content.
// Editors (?editor=<secret>) can edit cards in the page; their changes are
// saved to the "roadmap" tab of the Google Sheet via /api/roadmap, and once
// that tab has rows it takes precedence over the defaults here.

type RoadmapStatus = 'live' | 'uat' | 'build' | 'start' | 'disc' | 'plan' | 'opp';

type RoadmapItem = {
  product: string;
  title: string;
  detail: string;
  status: RoadmapStatus;
  eta?: string;
  dependency?: string;
};

type Lane = {
  id: string;
  name: string;
  desc: string;
  ongoing?: { title: string; detail: string };
  now: RoadmapItem[];
  next: RoadmapItem[];
  later: RoadmapItem[];
};

const ROADMAP_AS_OF = '21 Oct 2026';

const statusMeta: Record<RoadmapStatus, { label: string; color: string }> = {
  live: { label: 'Live', color: '#22A55C' },
  uat: { label: 'UAT', color: '#D98A00' },
  build: { label: 'In Progress', color: '#118BA1' },
  start: { label: 'Starting soon', color: '#07A5CB' },
  disc: { label: 'In Discovery', color: '#0A84FF' },
  plan: { label: 'Planned', color: '#5E5CE6' },
  opp: { label: 'Option', color: '#A1A1A6' },
};

const horizons = [
  { key: 'now', label: 'Now', range: 'Q4 2026 · Oct–Dec', color: '#118BA1' },
  { key: 'next', label: 'Next', range: 'H1 2027 · Jan–Jun', color: '#C99A2E' },
  { key: 'later', label: 'Later', range: 'H2 2027 onward', color: '#A1A1A6' },
] as const;

type HorizonKey = (typeof horizons)[number]['key'];

const LANES: Lane[] = [
  {
    id: 'products',
    name: 'Core products',
    desc: 'NEXA, NFI, ZeroPaper, CVNova, GTM Retail Tools, Audit Flow',
    now: [
      { product: 'NEXA', title: 'UAT and company-wide launch', detail: 'UAT and launch from 28 Oct with Travel and Marketing, backed by a launch campaign: office screen loop and launch emails.', status: 'uat' },
      { product: 'NEXA', title: 'General AI capabilities', detail: 'Starts right after UAT. Connect NEXA to general AI so it can research the internet, draft decks and write emails.', status: 'start', eta: '~2.5 months' },
      { product: 'NEXA', title: 'NSD tooling', detail: 'Bring NSD tools into NEXA so teams can act on them from Teams. Investigating integration options, as NSD does not currently have APIs.', status: 'disc', eta: '~1 month' },
      { product: 'NFI', title: 'Finance validation of live screens', detail: 'Live at nfi.netsoltech.com. Three-month UAT with weekly and month-end checks against finance-set variance thresholds.', status: 'uat' },
      { product: 'ZeroPaper', title: 'OCR accuracy improvements', detail: 'Raising extraction accuracy on uploaded employee documents.', status: 'build' },
      { product: 'CVNova', title: 'Talent Acquisition module', detail: 'CV repository with bulk upload, CV parsing, internship tracking and salary benchmarking.', status: 'build' },
      { product: 'CVNova', title: 'Review further requirements', detail: 'HR has more requirements. We will meet, assess them and decide what we take on.', status: 'disc' },
      { product: 'GTM · APAC Hub', title: 'APAC Opportunity Hub', detail: 'AI-scored accounts and signals, Salesforce import, rep queues, check-in nudges and notifications inside GTM Retail Tools.', status: 'build' },
      { product: 'Audit Flow', title: 'Phase 2 kick-off', detail: 'Builds on bank statement extraction for any bank, Excel output and SSO. Adds credit card statements and more audit workflow tasks.', status: 'start' },
    ],
    next: [
      { product: 'NFI', title: 'Cost Centre & Headcount screen', detail: 'Department-level costing, with drill-downs agreed with the CFO. Restore cash forecast card.', status: 'plan', dependency: 'ERMS / payroll data' },
      { product: 'CVNova', title: 'Build agreed requirements', detail: 'Deliver whatever we commit to from the HR requirements review.', status: 'plan' },
      { product: 'GTM · APAC Hub', title: 'Initial rollout', detail: 'Automatic identification of possible leads, rep updates, and a news page with the latest industry information.', status: 'plan' },
      { product: 'ZeroPaper', title: 'Wider HR adoption', detail: 'Scale bulk upload and NLP query to all employee records.', status: 'plan' },
      { product: 'Audit Flow', title: 'Phase 2 delivery', detail: 'Credit card statements and automated audit tasks in use by the audit team.', status: 'plan' },
    ],
    later: [
      { product: 'NEXA', title: 'Front door for AI Labs', detail: 'One place in Teams to reach AI Labs tools, including IRC and NSD tooling.', status: 'plan' },
      { product: 'CVNova', title: 'End-to-end recruitment', detail: 'Interview pipeline, offers and hiring-manager views on top of the TA module.', status: 'opp' },
      { product: 'GTM Retail Tools', title: 'Opportunity Hub for other regions', detail: 'Reuse the Hub model beyond APAC.', status: 'plan' },
      { product: 'Audit Flow', title: 'Audit automation platform', detail: 'Extend from extraction to a broader audit platform.', status: 'plan' },
      { product: 'UC-019', title: 'AI in Reimbursements', detail: 'Replace paper claims with a portal that validates and routes claims to Finance.', status: 'plan' },
    ],
  },
  {
    id: 'discovery',
    name: 'Department discovery',
    desc: 'Vision 2030: deciding which departments AI Labs takes on',
    now: [
      { product: 'Travel', title: 'Data analysis and go / no-go', detail: 'Initial data received. We are analysing it to decide whether to take Travel on.', status: 'disc' },
      { product: 'Procurement', title: 'Data requested', detail: 'Procurement has been asked to share data for the same assessment.', status: 'disc' },
      { product: 'Vision 2030', title: 'Data conversation with Salman', detail: 'Similar discussion scheduled for next week.', status: 'disc' },
    ],
    next: [
      { product: 'Vision 2030', title: 'Department roadmaps to OG', detail: 'Each department sets its 2030 vision, then we map how to get there in 6, 12 and 18-month phases. Agreed with department heads and presented to OG.', status: 'plan' },
      { product: 'Vision 2030', title: 'First department builds', detail: 'Start delivery for the departments that pass the data assessment.', status: 'plan' },
    ],
    later: [
      { product: 'Vision 2030', title: 'Roadmap execution by department', detail: 'Delivery of department roadmaps, tracked through the use case portfolio.', status: 'plan' },
    ],
  },
  {
    id: 'enable',
    name: 'AI enablement & governance',
    desc: 'Tools, policy, skills and strategy across NETSOL',
    ongoing: {
      title: 'AI tooling and training',
      detail: 'Ongoing in every horizon: Claude and other AI tool rollout, licence tracking, ICAN and AI literacy training, and AI coding adoption in NTE.',
    },
    now: [
      { product: 'Policy', title: 'Full AI usage policy with InfoSec', detail: 'Builds on the Interim Policy (July 2026) and ICAN training.', status: 'build' },
    ],
    next: [
      { product: 'Governance', title: 'SteerCo cadence embedded', detail: 'Monthly strategic SteerCo, operational reviews and regional check-ins running routinely.', status: 'plan' },
    ],
    later: [
      { product: 'Policy', title: 'Annual AI policy review', detail: 'First annual review of the AI policy, July 2027.', status: 'plan' },
    ],
  },
];

const DEPENDENCIES = [
  { title: 'Salesforce API access', detail: 'Shared by NFI and the APAC Opportunity Hub. Today we work from Excel exports.' },
  { title: 'ERMS / payroll data', detail: 'Required for NFI Screen 4, Cost Centre & Headcount Visibility.' },
  { title: 'Department data sharing', detail: 'Vision 2030 decisions for Procurement and the next departments depend on receiving their data.' },
];

function StatusDot({ status }: { status: RoadmapStatus }) {
  const meta = statusMeta[status];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-secondary">
      <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function RoadmapCard({ item, onEdit }: { item: RoadmapItem; onEdit?: () => void }) {
  return (
    <div className={`group relative flex flex-col gap-1.5 rounded-xl border bg-white px-3.5 py-3 ${item.status === 'opp' ? 'border-dashed border-ink-tertiary/60' : 'border-hairline'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">{item.product}</span>
        <div className="flex items-center gap-1">
          <StatusDot status={item.status} />
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${item.title}`}
              title="Edit card"
              className="-mr-1.5 rounded-full p-1 text-ink-tertiary opacity-60 transition hover:bg-black/[0.05] hover:text-ink group-hover:opacity-100 focus-visible:opacity-100"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-[13px] font-semibold leading-5 text-ink">{item.title}</p>
      <p className="text-xs leading-5 text-ink-secondary">{item.detail}</p>
      {(item.eta || item.dependency) && (
        <div className="mt-0.5 flex flex-wrap gap-1.5">
          {item.eta && <span className="rounded-md bg-black/[0.04] px-2 py-0.5 text-[11px] font-medium text-ink">{item.eta}</span>}
          {item.dependency && <span className="rounded-md bg-[#C4384A]/10 px-2 py-0.5 text-[11px] font-medium text-[#C4384A]">Dependency: {item.dependency}</span>}
        </div>
      )}
    </div>
  );
}

type FlatItem = RoadmapItem & { lane: string; horizon: HorizonKey };
type EditTarget = { laneId: string; horizon: HorizonKey; index: number };
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const STATUS_KEYS = Object.keys(statusMeta) as RoadmapStatus[];
const HORIZON_KEYS = horizons.map((h) => h.key) as HorizonKey[];

function flatten(lanes: Lane[]): FlatItem[] {
  return lanes.flatMap((lane) => HORIZON_KEYS.flatMap((h) => lane[h].map((item) => ({ ...item, lane: lane.id, horizon: h }))));
}

// Rebuilds the lanes from saved rows. Lane names, descriptions and the Ongoing
// banner still come from LANES; rows for an unknown lane are ignored.
function fromRows(rows: Array<Record<string, string>>): Lane[] {
  return LANES.map((lane) => {
    const pick = (h: HorizonKey): RoadmapItem[] =>
      rows
        .filter((r) => r.lane === lane.id && r.horizon === h)
        .map((r) => ({
          product: r.product ?? '',
          title: r.title ?? '',
          detail: r.detail ?? '',
          status: (STATUS_KEYS.includes(r.status as RoadmapStatus) ? r.status : 'plan') as RoadmapStatus,
          ...(r.eta ? { eta: r.eta } : {}),
          ...(r.dependency ? { dependency: r.dependency } : {}),
        }));
    return { ...lane, now: pick('now'), next: pick('next'), later: pick('later') };
  });
}

const fieldClass = 'w-full rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-accent';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-ink-secondary">{label}</span>
      {children}
    </label>
  );
}

function CardEditor({ item, horizon, onCancel, onSave, onDelete }: {
  item: RoadmapItem;
  horizon: HorizonKey;
  onCancel: () => void;
  onSave: (item: RoadmapItem, horizon: HorizonKey) => void;
  onDelete: () => void;
}) {
  const [form, setForm] = useState({ ...item, eta: item.eta ?? '', dependency: item.dependency ?? '' });
  const [column, setColumn] = useState<HorizonKey>(horizon);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const canSave = form.title.trim() !== '' && form.product.trim() !== '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    const next: RoadmapItem = {
      product: form.product.trim(),
      title: form.title.trim(),
      detail: form.detail.trim(),
      status: form.status,
      ...(form.eta.trim() ? { eta: form.eta.trim() } : {}),
      ...(form.dependency.trim() ? { dependency: form.dependency.trim() } : {}),
    };
    onSave(next, column);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <form onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="roadmap-edit-title" className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-hairline px-5 py-4">
          <h2 id="roadmap-edit-title" className="text-lg font-semibold tracking-tight text-ink">Edit roadmap card</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="rounded-full p-1.5 text-ink-secondary hover:bg-black/[0.04]"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-3 px-5 py-4 sm:grid-cols-2">
          <Field label="Product / area"><input className={fieldClass} value={form.product} onChange={set('product')} required /></Field>
          <Field label="Title"><input className={fieldClass} value={form.title} onChange={set('title')} required /></Field>
          <div className="sm:col-span-2">
            <Field label="Detail"><textarea className={fieldClass} rows={3} value={form.detail} onChange={set('detail')} /></Field>
          </div>
          <Field label="Status">
            <select className={fieldClass} value={form.status} onChange={set('status')}>
              {STATUS_KEYS.map((s) => <option key={s} value={s}>{statusMeta[s].label}</option>)}
            </select>
          </Field>
          <Field label="Column">
            <select className={fieldClass} value={column} onChange={(e) => setColumn(e.target.value as HorizonKey)}>
              {horizons.map((h) => <option key={h.key} value={h.key}>{h.label} · {h.range}</option>)}
            </select>
          </Field>
          <Field label="ETA (optional)"><input className={fieldClass} value={form.eta} onChange={set('eta')} placeholder="e.g. ~1 month" /></Field>
          <Field label="Dependency (optional)"><input className={fieldClass} value={form.dependency} onChange={set('dependency')} placeholder="e.g. ERMS / payroll data" /></Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline bg-[#FAFAFA] px-5 py-3">
          <button
            type="button"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${confirmDelete ? 'bg-[#C4384A] text-white' : 'text-[#C4384A] hover:bg-[#C4384A]/10'}`}
          >
            {confirmDelete ? 'Click again to remove' : 'Remove card'}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-full border border-hairline bg-white px-4 py-1.5 text-sm font-medium text-ink hover:bg-[#FAFAFA]">Cancel</button>
            <button type="submit" disabled={!canSave} className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function RoadmapBoard({ isEditor = false }: { isEditor?: boolean }) {
  const [laneFilter, setLaneFilter] = useState<string>('all');
  const [allLanes, setAllLanes] = useState<Lane[]>(LANES);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const lanes = laneFilter === 'all' ? allLanes : allLanes.filter((l) => l.id === laneFilter);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/roadmap')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && Array.isArray(data?.items)) setAllLanes(fromRows(data.items)); })
      .catch(() => { /* keep the defaults */ });
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(async (next: Lane[], previous: Lane[]) => {
    setAllLanes(next);
    setSaveState('saving');
    try {
      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: flatten(next) }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaveState('saved');
    } catch {
      setAllLanes(previous);
      setSaveState('error');
    }
  }, []);

  const editingItem = editing ? allLanes.find((l) => l.id === editing.laneId)?.[editing.horizon][editing.index] : undefined;

  const applyEdit = (updated: RoadmapItem | null, toHorizon?: HorizonKey) => {
    if (!editing) return;
    const { laneId, horizon, index } = editing;
    const previous = allLanes;
    const next = allLanes.map((lane) => {
      if (lane.id !== laneId) return lane;
      const copy: Lane = { ...lane, now: [...lane.now], next: [...lane.next], later: [...lane.later] };
      if (updated && toHorizon === horizon) {
        copy[horizon][index] = updated;
      } else {
        copy[horizon].splice(index, 1);
        if (updated && toHorizon) copy[toHorizon].push(updated);
      }
      return copy;
    });
    setEditing(null);
    void persist(next, previous);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">AI Labs Roadmap</h2>
          <p className="mt-1 text-sm text-ink-secondary">What we are delivering now, what comes next, and where we are heading. As of {ROADMAP_AS_OF}.</p>
          {isEditor && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-tertiary" aria-live="polite">
              {saveState === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>}
              {saveState === 'saved' && 'All changes saved.'}
              {saveState === 'error' && <span className="text-[#C4384A]">Couldn&apos;t save. Your last change was undone; please try again.</span>}
              {saveState === 'idle' && 'Use the pencil on any card to edit it.'}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', name: 'All areas' }, ...allLanes].map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLaneFilter(l.id)}
              aria-pressed={laneFilter === l.id}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${laneFilter === l.id ? 'bg-ink text-white' : 'border border-hairline bg-white text-ink-secondary hover:text-ink'}`}
            >
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {(Object.keys(statusMeta) as RoadmapStatus[]).map((s) => <StatusDot key={s} status={s} />)}
      </div>

      <div className="overflow-hidden rounded-2xl border border-hairline bg-white">
        <div className="hidden grid-cols-[200px_repeat(3,minmax(0,1fr))] border-b border-hairline bg-[#FAFAFA] lg:grid">
          <div />
          {horizons.map((h) => (
            <div key={h.key} className="border-l border-hairline-soft px-4 py-3">
              <div className="flex items-center gap-2 text-base font-semibold text-ink">
                <span className="h-2 w-2 rounded-full" style={{ background: h.color }} />
                {h.label}
              </div>
              <div className="mt-0.5 text-xs text-ink-tertiary">{h.range}</div>
            </div>
          ))}
        </div>

        {lanes.map((lane, idx) => (
          <div key={lane.id} className={`grid grid-cols-1 lg:grid-cols-[200px_repeat(3,minmax(0,1fr))] ${idx > 0 ? 'border-t border-hairline' : ''}`}>
            <div className={`bg-[#F2F7F9] px-4 py-4 ${lane.ongoing ? 'lg:row-span-2' : ''}`}>
              <p className="text-sm font-semibold text-ink">{lane.name}</p>
              <p className="mt-1 text-xs leading-5 text-ink-secondary">{lane.desc}</p>
            </div>
            {lane.ongoing && (
              <div className="px-3 pt-3 lg:col-span-3 lg:border-l lg:border-hairline-soft">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-dashed border-accent bg-[#F2F7F9] px-3.5 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                    <span className="h-2 w-2 rounded-full bg-accent" /> Ongoing
                  </span>
                  <span className="text-[13px] font-semibold text-ink">{lane.ongoing.title}</span>
                  <span className="min-w-0 flex-1 basis-80 text-xs text-ink-secondary">{lane.ongoing.detail}</span>
                </div>
              </div>
            )}
            {horizons.map((h) => {
              const items = lane[h.key];
              return (
                <div key={h.key} className="flex min-w-0 flex-col gap-2.5 border-t border-dashed border-hairline p-3 lg:border-l lg:border-t-0 lg:border-solid lg:border-hairline-soft">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary lg:hidden">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: h.color }} />
                    {h.label} · {h.range}
                  </div>
                  {items.length ? items.map((item, i) => (
                    <RoadmapCard
                      key={`${item.title}-${i}`}
                      item={item}
                      onEdit={isEditor ? () => setEditing({ laneId: lane.id, horizon: h.key, index: i }) : undefined}
                    />
                  )) : <p className="px-1 text-xs italic text-ink-tertiary">Nothing planned yet</p>}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink">Key dependencies to unblock</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEPENDENCIES.map((d) => (
            <div key={d.title} className="rounded-xl border border-hairline border-l-[3px] border-l-[#C4384A] bg-white px-4 py-3">
              <p className="text-[13px] font-semibold text-ink">{d.title}</p>
              <p className="mt-1 text-xs leading-5 text-ink-secondary">{d.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {editing && editingItem && (
        <CardEditor
          item={editingItem}
          horizon={editing.horizon}
          onCancel={() => setEditing(null)}
          onSave={(item, h) => applyEdit(item, h)}
          onDelete={() => applyEdit(null)}
        />
      )}

      <p className="text-xs text-ink-tertiary">Now items are committed and in flight. Next and Later items are directional and are re-prioritised each quarter with the AI SteerCo. Dashed cards are options we can take on.</p>
    </div>
  );
}
