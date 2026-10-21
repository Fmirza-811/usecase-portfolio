"use client";

import React, { useState } from 'react';

// AI Labs Now / Next / Later roadmap. Content is maintained here; edit the
// LANES array to update the board.

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

const LANES: Lane[] = [
  {
    id: 'products',
    name: 'Core products',
    desc: 'NEXA, NFI, ZeroPaper, CVNova, GTM Retail Tools, Audit Flow',
    now: [
      { product: 'NEXA', title: 'UAT and company-wide launch', detail: 'UAT and launch from 28 Oct with Travel and Marketing, backed by a launch campaign: office screen loop and launch emails.', status: 'uat' },
      { product: 'NEXA', title: 'General AI capabilities', detail: 'Starts right after UAT. Connect NEXA to general AI so it can research the internet, draft decks and write emails.', status: 'start', eta: '~2.5 months' },
      { product: 'NFI', title: 'Finance validation of live screens', detail: 'Live at nfi.netsoltech.com. Three-month UAT with weekly and month-end checks against finance-set variance thresholds.', status: 'uat' },
      { product: 'ZeroPaper', title: 'OCR accuracy improvements', detail: 'Raising extraction accuracy on uploaded employee documents.', status: 'build' },
      { product: 'CVNova', title: 'Talent Acquisition module', detail: 'CV repository with bulk upload, CV parsing, internship tracking and salary benchmarking.', status: 'build' },
      { product: 'CVNova', title: 'Review further requirements', detail: 'HR has more requirements. We will meet, assess them and decide what we take on.', status: 'disc' },
      { product: 'GTM · APAC Hub', title: 'APAC Opportunity Hub', detail: 'AI-scored accounts and signals, Salesforce import, rep queues, check-in nudges and notifications inside GTM Retail Tools.', status: 'build' },
      { product: 'Audit Flow', title: 'Phase 2 kick-off', detail: 'Builds on bank statement extraction for any bank, Excel output and SSO. Adds credit card statements and more audit workflow tasks.', status: 'start' },
    ],
    next: [
      { product: 'NEXA', title: 'NSD tooling', detail: 'Bring NSD tools into NEXA so teams can act on them from Teams. Start date to be confirmed.', status: 'plan', eta: '~1 month' },
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
      { product: 'Marketing', title: 'Media contact finder', detail: 'Find tier-one and tier-two editors for thought-leadership placements.', status: 'plan' },
      { product: 'Admin & Procurement', title: 'Digitisation from blueprint', detail: 'Build out the Admin & Procurement cockpit.', status: 'plan' },
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

function RoadmapCard({ item }: { item: RoadmapItem }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-xl border bg-white px-3.5 py-3 ${item.status === 'opp' ? 'border-dashed border-ink-tertiary/60' : 'border-hairline'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">{item.product}</span>
        <StatusDot status={item.status} />
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

export function RoadmapBoard() {
  const [laneFilter, setLaneFilter] = useState<string>('all');
  const lanes = laneFilter === 'all' ? LANES : LANES.filter((l) => l.id === laneFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">AI Labs Roadmap</h2>
          <p className="mt-1 text-sm text-ink-secondary">What we are delivering now, what comes next, and where we are heading. As of {ROADMAP_AS_OF}.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ id: 'all', name: 'All areas' }, ...LANES].map((l) => (
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
                  {items.length ? items.map((item) => <RoadmapCard key={item.title} item={item} />) : <p className="px-1 text-xs italic text-ink-tertiary">Nothing planned yet</p>}
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

      <p className="text-xs text-ink-tertiary">Now items are committed and in flight. Next and Later items are directional and are re-prioritised each quarter with the AI SteerCo. Dashed cards are options we can take on.</p>
    </div>
  );
}
