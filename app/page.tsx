"use client";

import React, { useEffect, useLayoutEffect, useMemo, useState, useCallback, useRef, useContext } from 'react';
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, LayoutGrid, Table2, CalendarDays, Building2, User2,
  ChevronRight, ChevronDown, X, Pencil,
  RefreshCw, Trash2, BarChart2, Upload, FileText, Send, Bot, Sliders,
  ArrowUp, ArrowDown, ArrowUpDown, Command, Loader2, CheckCircle2, AlertTriangle, Info,
  Square, CheckSquare, type LucideIcon,
} from 'lucide-react';

const EDITOR_SECRET = 'AIlabs2026';

type UserRole = 'viewer' | 'editor';
type ViewMode = 'table' | 'cards';
type AITab = 'chat' | 'score';

type UseCaseItem = {
  id: string;
  name: string;
  department: string;
  stakeholder: string;
  status: string;
  horizon: string;
  priority: string;
  description: string;
  impact: string;
  notes: string;
  updated: string;
  start_date: string;
  end_date: string;
  value_amount: string;
  brd_url: string;
  score: string;
};

type SortableKey = 'name' | 'department' | 'stakeholder' | 'status' | 'priority' | 'value_amount' | 'score' | 'horizon' | 'end_date' | 'updated';

type Message = { role: 'user' | 'assistant'; content: string };

type ScoreWeights = {
  roi_potential: number;
  complexity: number;
  time_to_build: number;
  data_availability: number;
  differentiation: number;
  urgency: number;
  strategic_alignment: number;
};

const defaultWeights: ScoreWeights = {
  roi_potential: 20,
  complexity: 15,
  time_to_build: 15,
  data_availability: 15,
  differentiation: 10,
  urgency: 10,
  strategic_alignment: 15,
};

const weightLabels: Record<keyof ScoreWeights, { label: string; desc: string }> = {
  roi_potential: { label: 'ROI Potential', desc: 'Commercial upside and monetization potential.' },
  complexity: { label: 'Complexity', desc: 'Product, integration, data, change, and delivery complexity.' },
  time_to_build: { label: 'Time to Build', desc: 'Expected MVP or first release timeline.' },
  data_availability: { label: 'Data Availability', desc: 'Availability and readiness of required data.' },
  differentiation: { label: 'Differentiation', desc: 'Ability to stand out versus the default market approach.' },
  urgency: { label: 'Urgency', desc: 'Near-term customer, market, or leadership pressure.' },
  strategic_alignment: { label: 'Strategic Alignment', desc: 'Fit with the company strategy, ICP, and roadmap.' },
};

const demoUseCases: UseCaseItem[] = [
  {
    id: 'UC-001', name: 'Autobid RFP Response Automation', department: 'Pre-Sales', stakeholder: 'Muneeb',
    status: 'In Progress', horizon: 'Current Quarter', priority: 'High',
    description: 'Automates first-draft RFP responses using approved content blocks, reusable answer libraries, and guided prompt workflows.',
    impact: 'Reduce proposal preparation time and improve consistency in responses.',
    notes: 'Needs stronger export and library management workflow.',
    updated: '2026-04-09', start_date: '2026-03-01', end_date: '2026-06-30',
    value_amount: '150000', brd_url: '', score: '',
  },
  {
    id: 'UC-002', name: 'Transcend Chatbot', department: 'Product', stakeholder: 'Fatima Mirza',
    status: 'In Discovery', horizon: 'Current Quarter', priority: 'High',
    description: 'Client-facing helpbot for Transcend Finance users to answer system questions and reduce repetitive support traffic.',
    impact: 'Lower support volume and improve self-service for clients.',
    notes: 'Need to define scope boundaries and escalation logic.',
    updated: '2026-04-08', start_date: '2026-04-01', end_date: '2026-07-31',
    value_amount: '80000', brd_url: '', score: '',
  },
  {
    id: 'UC-003', name: 'AI BI Insights for Wholesale Finance', department: 'Strategy', stakeholder: 'Fatima Mirza',
    status: 'Planned', horizon: 'Future Pipeline', priority: 'Medium',
    description: 'Executive dashboard layer for wholesale finance with natural-language insight generation and strategic KPI summaries.',
    impact: 'Help executives answer business questions quickly without depending on analysts.',
    notes: 'Best positioned as a strategic differentiator.',
    updated: '2026-04-06', start_date: '2026-07-01', end_date: '2026-12-31',
    value_amount: '1200000', brd_url: '', score: '',
  },
  {
    id: 'UC-004', name: 'Dealer Product Recommendation Engine', department: 'Sales', stakeholder: 'Fatima Mirza',
    status: 'Idea', horizon: 'Future Pipeline', priority: 'Medium',
    description: 'Recommends relevant finance products, contract types, and add-ons to improve dealer-side sales conversations.',
    impact: 'Drive smarter assisted selling with limited first-interaction customer data.',
    notes: 'Should stay recommendation-first, not advisory-heavy.',
    updated: '2026-04-04', start_date: '2026-09-01', end_date: '2027-03-31',
    value_amount: '50000', brd_url: '', score: '',
  },
];

const statusOptions = ['Idea', 'In Discovery', 'Planned', 'In Progress', 'Blocked', 'Live', 'On Hold', 'Removed'] as const;
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'] as const;
const horizonOptions = ['Current Quarter', 'Next Quarter', 'Future Pipeline'] as const;

// Apple-direction palette: status reads as a small colored dot + text, never a filled pill.
const statusDotColors: Record<string, string> = {
  Idea: '#A1A1A6',
  'In Discovery': '#0A84FF',
  Planned: '#5E5CE6',
  'In Progress': '#118BA1',
  Blocked: '#C4384A',
  Live: '#22A55C',
  'On Hold': '#A1A1A6',
  Removed: '#C7C7CC',
};

// Priority reads as weight + color intensity on plain text, never a badge.
const priorityTextStyles: Record<string, string> = {
  Low: 'text-ink-tertiary font-normal',
  Medium: 'text-ink-secondary font-medium',
  High: 'text-ink font-semibold',
  Critical: 'text-[#C4384A] font-semibold',
};

function getValueSigns(amount: string): string {
  const n = parseFloat(amount);
  if (!amount || isNaN(n)) return '';
  if (n >= 1000000) return '$$$';
  if (n >= 10000) return '$$';
  return '$';
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function formatUpdated(value: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// Avoids the "useLayoutEffect does nothing on the server" warning during Next.js SSR.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// ── Clamped description (3 lines, with "See more" when it actually overflows) ──
function ClampedText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p ref={ref} className={cn('text-sm leading-6 text-ink-secondary', !expanded && 'line-clamp-3')}>
        {text}
      </p>
      {(overflowing || expanded) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          className="mt-1 text-xs font-semibold text-accent transition hover:text-accent-deep"
        >
          {expanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  );
}

// ── Toasts (autosave feedback, undo, error/retry) ──────────────────────────────
type ToastKind = 'pending' | 'success' | 'error' | 'info';
type ToastItem = { id: string; kind: ToastKind; message: string; actionLabel?: string; onAction?: () => void };
type ToastAPI = {
  push: (t: Omit<ToastItem, 'id'>, durationMs?: number) => string;
  update: (id: string, patch: Partial<Omit<ToastItem, 'id'>>, durationMs?: number) => void;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastAPI | null>(null);

function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

function useToastState() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const clearTimer = (id: string) => {
    if (timers.current[id]) { clearTimeout(timers.current[id]); delete timers.current[id]; }
  };

  const scheduleClear = useCallback((id: string, durationMs: number) => {
    clearTimer(id);
    if (durationMs <= 0) return;
    timers.current[id] = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, durationMs);
  }, []);

  const defaultDuration = (kind: ToastKind) => (kind === 'pending' ? 0 : kind === 'error' ? 7000 : 4000);

  const push = useCallback<ToastAPI['push']>((t, durationMs) => {
    const id = `toast-${++counter.current}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    scheduleClear(id, durationMs ?? defaultDuration(t.kind));
    return id;
  }, [scheduleClear]);

  const update = useCallback<ToastAPI['update']>((id, patch, durationMs) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    scheduleClear(id, durationMs ?? defaultDuration(patch.kind ?? 'info'));
  }, [scheduleClear]);

  const dismiss = useCallback((id: string) => {
    clearTimer(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => () => { Object.values(timers.current).forEach(clearTimeout); }, []);

  return { toasts, api: { push, update, dismiss } };
}

const toastVisuals: Record<ToastKind, { icon: LucideIcon; className: string }> = {
  pending: { icon: Loader2, className: 'bg-ink text-white' },
  success: { icon: CheckCircle2, className: 'bg-ink text-white' },
  error: { icon: AlertTriangle, className: 'bg-[#C4384A] text-white' },
  info: { icon: Info, className: 'bg-ink text-white' },
};

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-full max-w-sm flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const visual = toastVisuals[t.kind];
          const Icon = visual.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className={cn('pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl', visual.className)}
            >
              <Icon className={cn('h-4 w-4 shrink-0', t.kind === 'pending' && 'animate-spin')} />
              <span className="flex-1 text-sm leading-5">{t.message}</span>
              {t.actionLabel && t.onAction && (
                <button
                  type="button"
                  onClick={() => { t.onAction?.(); onDismiss(t.id); }}
                  className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold transition hover:bg-white/25"
                >
                  {t.actionLabel}
                </button>
              )}
              <button type="button" onClick={() => onDismiss(t.id)} className="shrink-0 text-white/50 transition hover:text-white" aria-label="Dismiss">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, api } = useToastState();
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={api.dismiss} />
    </ToastContext.Provider>
  );
}

type SurfaceProps = { className?: string; children: ReactNode };
function Card({ className, children }: SurfaceProps) { return <div className={cn('rounded-2xl border border-hairline bg-white', className)}>{children}</div>; }
function CardHeader({ className, children }: SurfaceProps) { return <div className={cn('p-6 pb-3', className)}>{children}</div>; }
function CardTitle({ className, children }: SurfaceProps) { return <h3 className={cn('text-lg font-semibold text-ink', className)}>{children}</h3>; }
function CardDescription({ className, children }: SurfaceProps) { return <p className={cn('text-sm text-ink-tertiary', className)}>{children}</p>; }
function CardContent({ className, children }: SurfaceProps) { return <div className={cn('p-6', className)}>{children}</div>; }

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
type ButtonSize = 'default' | 'icon';
type ButtonProps = { className?: string; variant?: ButtonVariant; size?: ButtonSize; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-accent text-white hover:opacity-90',
    outline: 'border border-hairline bg-white text-ink hover:bg-[#FAFAFA]',
    ghost: 'bg-transparent text-ink-secondary hover:bg-black/[0.04]',
    secondary: 'bg-black/[0.05] text-ink hover:bg-black/[0.08]',
    danger: 'bg-[#C4384A] text-white hover:opacity-90',
  };
  const sizes: Record<ButtonSize, string> = { default: 'h-10 px-4 py-2', icon: 'h-10 w-10 p-0' };
  return (
    <button className={cn('inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

function Input({ className, ...props }: { className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-full border border-hairline bg-white px-4 py-2.5 text-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-accent', className)} {...props} />;
}
function Textarea({ className, ...props }: { className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-2xl border border-hairline bg-white px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-tertiary focus:border-accent', className)} {...props} />;
}
function Select({ className, children, ...props }: { className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'w-full appearance-none rounded-full border border-hairline bg-white px-4 py-2.5 pr-8 text-sm text-ink outline-none focus:border-accent',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
    </div>
  );
}

// ── Inline quick-edit status (dot + text) ───────────────────────────────────────
function StatusIndicator({ value, isEditor, onChange }: {
  value: string;
  isEditor: boolean;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const dot = statusDotColors[value] ?? '#A1A1A6';

  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        aria-label="Change status"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { onChange(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); } }}
        className="rounded-full border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-ink outline-none"
      >
        {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  const content = (
    <span className="inline-flex items-center gap-2 text-sm text-ink">
      <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: dot }} />
      {value}
    </span>
  );

  if (!isEditor) return content;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      aria-label={`Change status (currently ${value})`}
      title="Click to change status"
      className="-mx-1.5 rounded-full px-1.5 py-0.5 transition hover:bg-black/[0.04]"
    >
      {content}
    </button>
  );
}

// ── Inline quick-edit priority (weight + color, no badge) ──────────────────────
function PriorityIndicator({ value, isEditor, onChange }: {
  value: string;
  isEditor: boolean;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <select
        autoFocus
        value={value}
        aria-label="Change priority"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => { onChange(e.target.value); setEditing(false); }}
        onBlur={() => setEditing(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditing(false); } }}
        className="rounded-full border border-hairline bg-white px-2.5 py-1 text-xs font-medium text-ink outline-none"
      >
        {priorityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }

  const content = <span className={cn('text-sm', priorityTextStyles[value])}>{value}</span>;

  if (!isEditor) return content;

  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      aria-label={`Change priority (currently ${value})`}
      title="Click to change priority"
      className="-mx-1.5 rounded-full px-1.5 py-0.5 transition hover:bg-black/[0.04]"
    >
      {content}
    </button>
  );
}

function SortHeader({ label, sortKey, activeKey, dir, onSort, align }: {
  label: string; sortKey: SortableKey; activeKey: SortableKey | null; dir: 'asc' | 'desc'; onSort: (key: SortableKey) => void; align?: 'right';
}) {
  const active = activeKey === sortKey;
  return (
    <th className={cn('whitespace-nowrap px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary', align === 'right' && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('inline-flex items-center gap-1.5 normal-case tracking-normal transition-colors hover:text-ink', active && 'text-ink')}
      >
        {label}
        {active ? (
          dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-ink-tertiary" />
        )}
      </button>
    </th>
  );
}

function AccessBadge({ role }: { role: UserRole }) {
  const isEditor = role === 'editor';
  return (
    <div className="inline-flex items-center gap-2 text-sm text-ink-secondary">
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: isEditor ? 'var(--color-live)' : '#A1A1A6' }} />
      {isEditor ? 'Editor access' : 'Viewer access'}
    </div>
  );
}

type ModalProps = { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode };
function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-hairline px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
              {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} type="button"><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>{children}</div>
        {footer && <div className="border-t border-hairline bg-canvas px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div className={cn('fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div className={cn('absolute inset-0 bg-black/20 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div className={cn('absolute right-0 top-0 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>
        {children}
      </div>
    </div>
  );
}

// ── Command palette (Ctrl/Cmd+K to jump to any use case) ────────────────────────
type PaletteEntry = { id: string; title: string; subtitle: string; onSelect: () => void };

function CommandPalette({ open, onClose, useCases, onOpenItem, onAddNew, isEditor, modLabel }: {
  open: boolean;
  onClose: () => void;
  useCases: UseCaseItem[];
  onOpenItem: (item: UseCaseItem) => void;
  onAddNew: () => void;
  isEditor: boolean;
  modLabel: string;
}) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlight(0);
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = !q ? useCases : useCases.filter((u) =>
      `${u.id} ${u.name} ${u.department} ${u.stakeholder} ${u.status}`.toLowerCase().includes(q)
    );
    const items: PaletteEntry[] = matches.slice(0, 8).map((u) => ({
      id: u.id,
      title: u.name || u.id,
      subtitle: `${u.id} · ${u.department || 'No department'} · ${u.status || 'No status'}`,
      onSelect: () => onOpenItem(u),
    }));
    if (isEditor && (!q || 'add new use case'.includes(q))) {
      items.push({ id: '__add__', title: 'Add new use case', subtitle: 'Create a fresh entry', onSelect: onAddNew });
    }
    return items;
  }, [query, useCases, isEditor, onOpenItem, onAddNew]);

  useEffect(() => { setHighlight(0); }, [entries.length]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/20 p-4 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/70 bg-white/85 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/[0.06] px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-ink-tertiary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a use case, or add a new one..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-tertiary"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, entries.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); entries[highlight]?.onSelect(); }
            }}
          />
          <kbd className="shrink-0 rounded-md border border-hairline bg-white px-1.5 py-0.5 text-[10px] text-ink-tertiary">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {entries.length === 0 && <div className="px-5 py-6 text-sm text-ink-tertiary">No matches.</div>}
          {entries.map((entry, i) => (
            <button
              key={entry.id}
              type="button"
              onClick={entry.onSelect}
              onMouseEnter={() => setHighlight(i)}
              className={cn('flex w-full flex-col items-start gap-0.5 px-5 py-2.5 text-left transition-colors', i === highlight ? 'bg-black/[0.04]' : 'hover:bg-black/[0.02]')}
            >
              <span className="text-sm font-semibold text-ink">{entry.title}</span>
              <span className="text-xs text-ink-secondary">{entry.subtitle}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-black/[0.06] px-5 py-2.5 text-[11px] text-ink-tertiary">
          <kbd className="rounded border border-hairline px-1 py-0.5">↑↓</kbd> navigate · <kbd className="rounded border border-hairline px-1 py-0.5">Enter</kbd> select · <kbd className="rounded border border-hairline px-1 py-0.5">{modLabel}K</kbd> toggle
        </div>
      </div>
    </div>
  );
}

// ── Bulk action bar (multi-select rows/cards) ───────────────────────────────────
function BulkActionBar({ count, onSetStatus, onSetPriority, onDelete, onClear, busy }: {
  count: number;
  onSetStatus: (status: string) => void;
  onSetPriority: (priority: string) => void;
  onDelete: () => void;
  onClear: () => void;
  busy: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
      className="fixed inset-x-0 bottom-6 z-[65] flex justify-center px-4"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-full bg-ink px-5 py-3 text-white shadow-2xl">
        <span className="text-sm font-medium">{count} selected</span>
        <div className="h-5 w-px bg-white/20" />
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => { if (e.target.value) onSetStatus(e.target.value); e.target.value = ''; }}
          className="h-9 rounded-full border border-white/20 bg-white/10 px-3 text-xs text-white outline-none disabled:opacity-50 [&>option]:text-ink"
        >
          <option value="" disabled>Set status…</option>
          {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          defaultValue=""
          disabled={busy}
          onChange={(e) => { if (e.target.value) onSetPriority(e.target.value); e.target.value = ''; }}
          className="h-9 rounded-full border border-white/20 bg-white/10 px-3 text-xs text-white outline-none disabled:opacity-50 [&>option]:text-ink"
        >
          <option value="" disabled>Set priority…</option>
          {priorityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <Button variant="danger" onClick={onDelete} disabled={busy} type="button" className="h-9">
          <Trash2 className="h-4 w-4" /> Delete
        </Button>
        <button type="button" onClick={onClear} className="ml-1 shrink-0 text-white/60 transition hover:text-white" aria-label="Clear selection">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ── Gantt Chart ───────────────────────────────────────────────────────────────
function GanttChart({ items }: { items: UseCaseItem[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: UseCaseItem } | null>(null);
  const validItems = items.filter((i) => {
  if (!i.start_date || !i.end_date) return false;
  const s = new Date(i.start_date.trim());
  const e = new Date(i.end_date.trim());
  return !isNaN(s.getTime()) && !isNaN(e.getTime());
});
  if (validItems.length === 0) return (
    <Card><CardContent className="p-8 text-center text-ink-tertiary">No timeline data available.</CardContent></Card>
  );
  const allDates = validItems.flatMap((i) => [new Date(i.start_date), new Date(i.end_date)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  minDate.setDate(1); maxDate.setMonth(maxDate.getMonth() + 1); maxDate.setDate(0);
  const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
  const months: { label: string; left: number; width: number }[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const left = Math.max(0, (monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    const end = Math.min(100, (monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    months.push({ label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }), left, width: end - left });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const today = new Date();
  const todayPct = Math.min(100, Math.max(0, (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100));
  const showToday = today >= minDate && today <= maxDate;
  return (
    <>
      {tooltip && (
        <div className="fixed z-50 pointer-events-none" style={{ left: tooltip.x + 12, top: tooltip.y - 60 }}>
          <div className="rounded-2xl bg-ink shadow-2xl px-4 py-3 text-xs">
            <p className="font-semibold text-white text-sm">{tooltip.item.status}</p>
            <p className="text-white/60 mt-1">{tooltip.item.start_date} → {tooltip.item.end_date}</p>
          </div>
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="border-b border-hairline-soft px-6 py-4">
          <div className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-ink-secondary" /><h3 className="font-semibold text-ink">Timeline</h3></div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <div style={{ minWidth: '600px' }}>
              <div className="relative mb-3 ml-48 h-6">
                {months.map((m, i) => <div key={i} className="absolute text-xs text-ink-tertiary" style={{ left: `${m.left}%`, width: `${m.width}%` }}>{m.label}</div>)}
              </div>
              <div className="relative ml-48 space-y-3">
                {months.map((m, i) => <div key={i} className="pointer-events-none absolute top-0 bottom-0 border-l border-hairline-soft" style={{ left: `${m.left}%` }} />)}
                {showToday && (
                  <div className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-accent" style={{ left: `${todayPct}%` }}>
                    <span className="absolute -top-6 -translate-x-1/2 rounded bg-accent px-1.5 py-0.5 text-xs text-white">Today</span>
                  </div>
                )}
                {validItems.map((item) => {
                  const start = new Date(item.start_date.trim());
const end = new Date(item.end_date.trim());
                  const leftPct = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100;
                  const widthPct = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100;
                  const barColor = statusDotColors[item.status] ?? '#A1A1A6';
                  return (
                    <div key={item.id} className="flex items-center gap-0">
                      <div className="absolute -ml-48 w-44 truncate pr-3 text-right text-sm text-ink-secondary" title={item.name}>{item.name}</div>
                      <div className="relative h-8 w-full rounded-xl bg-canvas">
                        <div
                          className="absolute h-full rounded-xl opacity-90 transition-all cursor-pointer"
                          style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.min(100 - Math.max(0, leftPct), widthPct)}%`, background: barColor }}
                          onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, item })}
                          onMouseMove={(e) => setTooltip({ x: e.clientX, y: e.clientY, item })}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {Object.entries(statusDotColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-1.5 text-xs text-ink-secondary">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{status}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AIPanel({ open, onClose, allUseCases, onScoreSaved }: {
  open: boolean;
  onClose: () => void;
  allUseCases: UseCaseItem[];
  onScoreSaved: (id: string, score: string) => void;
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AITab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState<ScoreWeights>(defaultWeights);
  const [selectedForScoring, setSelectedForScoring] = useState<UseCaseItem | null>(null);
  const [scoreResult, setScoreResult] = useState<{ total: number; breakdown: Record<string, number>; reasoning: string } | null>(null);
  const [scoring, setScoring] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: "Hi! I'm here to help you define, document, and evaluate AI use cases. Tell me about a use case and I'll help you understand it, generate a BRD, or score it." }]);
    }
  }, [open]);

  useEffect(() => { setScoreResult(null); }, [selectedForScoring]);

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', messages: newMessages, weights }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'assistant', content: data.content }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    }
    setLoading(false);
  };

  const scoreUseCase = async () => {
    if (!selectedForScoring) return;
    setScoring(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'score', useCase: selectedForScoring, weights }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error ?? 'Scoring failed');
      setScoreResult(data);
      onScoreSaved(selectedForScoring.id, String(data.total));
    } catch {
      toast.push({ kind: 'error', message: 'Scoring failed. Please try again.', actionLabel: 'Retry', onAction: () => void scoreUseCase() });
    }
    setScoring(false);
  };

  return (
    <div className={cn('fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div className={cn('absolute inset-0 bg-black/20 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div className={cn('absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform flex flex-col', open ? 'translate-x-0' : 'translate-x-full')}>
        <div className="border-b border-hairline px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-accent/10 p-2"><Bot className="h-5 w-5 text-accent" /></div>
              <div>
                <h2 className="text-lg font-semibold text-ink">AI Use Case Assistant</h2>
                <p className="text-xs text-ink-secondary">Define, document and rank use cases</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose} type="button"><X className="h-4 w-4" /></Button>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => setActiveTab('chat')} className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm transition', activeTab === 'chat' ? 'bg-accent text-white' : 'text-ink-secondary hover:bg-black/[0.04]')} type="button">
              <Send className="h-4 w-4" /> Chat
            </button>
            <button onClick={() => setActiveTab('score')} className={cn('flex items-center gap-2 rounded-full px-4 py-2 text-sm transition', activeTab === 'score' ? 'bg-accent text-white' : 'text-ink-secondary hover:bg-black/[0.04]')} type="button">
              <Sliders className="h-4 w-4" /> Score & Rank
            </button>
          </div>
        </div>

        {activeTab === 'chat' && (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn('max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap', m.role === 'user' ? 'bg-accent text-white' : 'bg-canvas text-ink')}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-canvas rounded-3xl px-4 py-3 text-sm text-ink-secondary">Thinking...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-hairline p-4">
              <div className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Describe a use case or ask a question..." onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }} />
                <Button onClick={() => void sendMessage()} disabled={loading || !input.trim()} type="button" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'score' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-secondary">Select use case to score</label>
              <Select
                value={selectedForScoring?.id ?? ''}
                onChange={(e) => {
                  const found = allUseCases.find((u) => u.id === e.target.value) ?? null;
                  setSelectedForScoring(found);
                }}
              >
                <option value="">Choose a use case...</option>
                {allUseCases.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink">Scoring factors</h3>
                <span className={cn('text-xs font-medium', totalWeight === 100 ? 'text-[var(--color-live)]' : 'text-[#C4384A]')}>
                  Total: {totalWeight}% {totalWeight !== 100 ? '(must equal 100%)' : '✓'}
                </span>
              </div>
              <p className="text-sm text-ink-secondary">Adjust weights to reflect your priorities. Must add up to 100%.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(Object.keys(weights) as (keyof ScoreWeights)[]).map((key) => (
                <div key={key} className="rounded-2xl border border-hairline p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-ink">{weightLabels[key].label}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-ink-secondary">{weights[key]}%</span>
                      <button onClick={() => setWeights((w) => ({ ...w, [key]: Math.max(0, w[key] - 5) }))} className="text-ink-tertiary hover:text-ink px-1" type="button">↓</button>
                      <button onClick={() => setWeights((w) => ({ ...w, [key]: Math.min(100, w[key] + 5) }))} className="text-ink-tertiary hover:text-ink px-1" type="button">↑</button>
                    </div>
                  </div>
                  <p className="text-xs text-ink-tertiary">{weightLabels[key].desc}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => void scoreUseCase()}
              disabled={scoring || totalWeight !== 100 || !selectedForScoring}
              className="w-full"
              type="button"
            >
              {scoring ? 'Scoring...' : selectedForScoring ? `Score "${selectedForScoring.name}"` : 'Select a use case first'}
            </Button>

            {scoreResult && selectedForScoring && (
              <div className="rounded-2xl border border-hairline overflow-hidden">
                <div className="bg-ink px-6 py-4 flex items-center justify-between">
                  <div>
                    <span className="text-white font-semibold">{selectedForScoring.name}</span>
                    <p className="text-white/50 text-xs mt-0.5">AI Priority Score</p>
                  </div>
                  <span className="text-3xl font-bold text-white">{scoreResult.total}<span className="text-sm text-white/50">/100</span></span>
                </div>
                <div className="p-5 space-y-3">
                  {Object.entries(scoreResult.breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-sm text-ink-secondary w-36">{weightLabels[key as keyof ScoreWeights]?.label ?? key}</span>
                      <div className="flex-1 h-2 rounded-full bg-canvas">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(val / 5) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-ink">{val}/5</span>
                    </div>
                  ))}
                  <p className="text-sm text-ink-secondary pt-2 border-t border-hairline-soft">{scoreResult.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────
const emptyForm: UseCaseItem = {
  id: '', name: '', department: '', stakeholder: '',
  status: 'Idea', horizon: 'Future Pipeline', priority: 'Medium',
  description: '', impact: '', notes: '',
  updated: new Date().toISOString().slice(0, 10),
  start_date: '', end_date: '', value_amount: '', brd_url: '', score: '',
};

function UseCaseForm({ open, onOpenChange, onSave, editingItem, modLabel }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSave: (item: UseCaseItem) => Promise<boolean>; editingItem: UseCaseItem | null; modLabel: string;
}) {
  const toast = useToast();
  const [form, setForm] = useState<UseCaseItem>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(editingItem ?? emptyForm); setSubmitError(null); }, [editingItem, open]);
  const update = (key: keyof UseCaseItem, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = useCallback(async () => {
    if (!form.id || !form.name) {
      setSubmitError('Use Case ID and Name are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const ok = await onSave({ ...form });
    setSubmitting(false);
    if (ok) onOpenChange(false);
    else setSubmitError("Couldn't save — check your connection and try again.");
  }, [form, onSave, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void handleSubmit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleSubmit]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !form.id) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('id', form.id);
    try {
      const res = await fetch('/api/usecases', { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error ?? 'Upload failed');
      if (data.url) { update('brd_url', data.url); toast.push({ kind: 'success', message: 'BRD uploaded' }); }
    } catch {
      toast.push({ kind: 'error', message: 'BRD upload failed. Please try again.' });
    }
    setUploading(false);
  };

  const signs = getValueSigns(form.value_amount);

  return (
    <Modal
      open={open} onClose={() => onOpenChange(false)}
      title={editingItem ? 'Edit use case' : 'Add new use case'}
      description="Keep updates lightweight while capturing enough detail for reviews, planning, and execution."
      footer={
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs">
            {submitError ? (
              <span className="font-medium text-[#C4384A]">{submitError}</span>
            ) : (
              <span className="text-ink-tertiary">Press <kbd className="rounded border border-hairline px-1 py-0.5">{modLabel}</kbd>+<kbd className="rounded border border-hairline px-1 py-0.5">Enter</kbd> to save</span>
            )}
          </p>
          <div className="flex shrink-0 justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} type="button" disabled={submitting}>Cancel</Button>
            <Button onClick={() => void handleSubmit()} type="button" disabled={submitting}>
              {submitting ? 'Saving...' : editingItem ? 'Save changes' : 'Create use case'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Use Case ID</label>
          <Input value={form.id} onChange={(e) => update('id', e.target.value)} placeholder="UC-005" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Department</label>
          <Select value={form.department} onChange={(e) => update('department', e.target.value)}>
            <option value="">Select department</option>
            <option value="Pre-Sales">Pre-Sales</option>
            <option value="Strategy">Strategy</option>
            <option value="Sales">Sales</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="QA">QA</option>
            <option value="BD">BD</option>
            <option value="Marketing">Marketing</option>
            <option value="Client Services">Client Services</option>
            <option value="Procurement">Procurement</option>
            <option value="Admin">Admin</option>
            <option value="NOS">NOS</option>
            <option value="Executive">Executive</option>
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Use Case Name</label>
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Collections optimization assistant" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Primary Stakeholder</label>
          <Input value={form.stakeholder} onChange={(e) => update('stakeholder', e.target.value)} placeholder="Fatima Mirza" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Last Updated</label>
          <div className="flex h-[42px] items-center rounded-full border border-hairline bg-canvas px-4 text-sm text-ink-secondary">
            {editingItem ? formatUpdated(form.updated) : 'Set automatically when saved'}
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Status</label>
          <Select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Priority</label>
          <Select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            {priorityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Portfolio Horizon</label>
          <Select value={form.horizon} onChange={(e) => update('horizon', e.target.value)}>
            {horizonOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Start Date</label>
          <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-ink-secondary">End Date</label>
          <Input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Estimated Value (USD)</label>
          <div className="relative">
            <Input value={form.value_amount} onChange={(e) => update('value_amount', e.target.value)} placeholder="e.g. 150000" type="number" className="pr-16" />
            {signs && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-live)] font-semibold text-sm">{signs}</span>}
          </div>
          <p className="mt-1 text-xs text-ink-tertiary">Under $10k = $ · $10k–$1M = $$ · Over $1M = $$$</p>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">BRD Document</label>
          <div className="flex gap-2">
            <Input value={form.brd_url} onChange={(e) => update('brd_url', e.target.value)} placeholder="Paste link or upload file" className="flex-1" />
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading || !form.id} type="button">
              <Upload className="h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileUpload} />
          </div>
          {!form.id && <p className="mt-1 text-xs text-[#B8860B]">Enter a Use Case ID first to enable file upload</p>}
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Description</label>
          <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="min-h-[110px]" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Expected Impact</label>
          <Textarea value={form.impact} onChange={(e) => update('impact', e.target.value)} className="min-h-[90px]" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-ink-secondary">Notes</label>
          <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="min-h-[90px]" />
        </div>
      </div>
    </Modal>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function UseCasePortfolioAppInner() {
  const toast = useToast();
  const [useCases, setUseCases] = useState<UseCaseItem[]>(demoUseCases);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [view, setView] = useState<ViewMode>('table');
  const [activeItem, setActiveItem] = useState<UseCaseItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UseCaseItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('viewer');
  const [aiOpen, setAiOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [modLabel, setModLabel] = useState('Ctrl');

  const isEditor = userRole === 'editor';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('editor') === EDITOR_SECRET) setUserRole('editor');
    if (/Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)) setModLabel('⌘');
    void loadData({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async (opts?: { silent?: boolean }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/usecases');
      if (!res.ok) throw new Error('Failed');
      const data: UseCaseItem[] = await res.json();
      const next = data.length > 0 ? data : demoUseCases;
      setUseCases(next);
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => next.some((u) => u.id === id))));
    } catch {
      setUseCases((prev) => (prev.length ? prev : demoUseCases));
      if (!opts?.silent) {
        toast.push({ kind: 'error', message: "Couldn't reach the data source — showing existing data.", actionLabel: 'Retry', onAction: () => void loadData() });
      }
    }
    setLoading(false);
  }, [toast]);

  const saveItem = useCallback(async (item: UseCaseItem): Promise<boolean> => {
    setSaving(true);
    const stamped: UseCaseItem = { ...item, updated: new Date().toISOString() };
    try {
      const res = await fetch('/api/usecases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stamped) });
      if (!res.ok) throw new Error('Failed');
      await loadData({ silent: true });
      setEditingItem(null);
      setSaving(false);
      return true;
    } catch {
      setSaving(false);
      return false;
    }
  }, [loadData]);

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this use case?')) return;
    setSaving(true);
    const toastId = toast.push({ kind: 'pending', message: 'Deleting use case…' });
    try {
      const res = await fetch('/api/usecases', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('Failed');
      setActiveItem(null);
      await loadData({ silent: true });
      toast.update(toastId, { kind: 'success', message: 'Use case deleted', actionLabel: undefined, onAction: undefined });
    } catch {
      toast.update(toastId, { kind: 'error', message: "Couldn't delete — try again", actionLabel: 'Retry', onAction: () => void deleteItem(id) });
    }
    setSaving(false);
  }, [toast, loadData]);

  const handleScoreSaved = useCallback(async (id: string, score: string) => {
    const item = useCases.find((u) => u.id === id);
    if (!item) return;
    const ok = await saveItem({ ...item, score });
    if (!ok) toast.push({ kind: 'error', message: "Couldn't save the AI score", actionLabel: 'Retry', onAction: () => void handleScoreSaved(id, score) });
  }, [useCases, saveItem, toast]);

  // Inline quick-edit (status / priority) with optimistic update, autosave, and undo.
  const applyFieldChange = useCallback(async (item: UseCaseItem, field: 'status' | 'priority', nextValue: string) => {
    if (item[field] === nextValue) return;
    const prevValue = item[field];
    const stampedUpdated = new Date().toISOString();
    const label = field === 'status' ? 'Status' : 'Priority';

    setUseCases((prev) => prev.map((u) => (u.id === item.id ? { ...u, [field]: nextValue, updated: stampedUpdated } : u)));

    const toastId = toast.push({
      kind: 'success',
      message: `${label} changed to "${nextValue}"`,
      actionLabel: 'Undo',
      onAction: () => { void applyFieldChange({ ...item, [field]: nextValue, updated: stampedUpdated }, field, prevValue); },
    });

    try {
      const res = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, [field]: nextValue, updated: stampedUpdated }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      setUseCases((prev) => prev.map((u) => (u.id === item.id ? { ...u, [field]: prevValue } : u)));
      toast.update(toastId, {
        kind: 'error',
        message: `Couldn't save ${label.toLowerCase()} change`,
        actionLabel: 'Retry',
        onAction: () => void applyFieldChange(item, field, nextValue),
      });
    }
  }, [toast]);

  // Bulk actions
  const bulkSetField = useCallback(async (ids: string[], field: 'status' | 'priority', value: string) => {
    const targets = useCases.filter((u) => ids.includes(u.id));
    if (targets.length === 0) return;
    setBulkBusy(true);
    const label = field === 'status' ? 'status' : 'priority';
    const toastId = toast.push({ kind: 'pending', message: `Updating ${targets.length} use case${targets.length > 1 ? 's' : ''}…` });
    const stampedUpdated = new Date().toISOString();
    const prevValues = new Map(targets.map((t) => [t.id, t[field]]));

    setUseCases((prev) => prev.map((u) => (ids.includes(u.id) ? { ...u, [field]: value, updated: stampedUpdated } : u)));

    const results = await Promise.allSettled(targets.map(async (t) => {
      const res = await fetch('/api/usecases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, [field]: value, updated: stampedUpdated }),
      });
      if (!res.ok) throw new Error('failed');
    }));
    const failedIds = targets.filter((_, i) => results[i].status === 'rejected').map((t) => t.id);

    if (failedIds.length > 0) {
      setUseCases((prev) => prev.map((u) => (failedIds.includes(u.id) ? { ...u, [field]: prevValues.get(u.id) ?? u[field] } : u)));
      toast.update(toastId, {
        kind: 'error',
        message: `${targets.length - failedIds.length} updated, ${failedIds.length} failed`,
        actionLabel: 'Retry failed',
        onAction: () => void bulkSetField(failedIds, field, value),
      });
    } else {
      toast.update(toastId, { kind: 'success', message: `Updated ${label} on ${targets.length} use case${targets.length > 1 ? 's' : ''}`, actionLabel: undefined, onAction: undefined });
    }
    setBulkBusy(false);
  }, [useCases, toast]);

  const bulkDelete = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} use case${ids.length > 1 ? 's' : ''}? This can't be undone.`)) return;
    setBulkBusy(true);
    const toastId = toast.push({ kind: 'pending', message: `Deleting ${ids.length} use case${ids.length > 1 ? 's' : ''}…` });
    const results = await Promise.allSettled(ids.map(async (id) => {
      const res = await fetch('/api/usecases', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!res.ok) throw new Error('failed');
    }));
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
    await loadData({ silent: true });
    setSelectedIds(new Set(failedIds));
    if (failedIds.length === 0) {
      toast.update(toastId, { kind: 'success', message: `Deleted ${ids.length} use case${ids.length > 1 ? 's' : ''}`, actionLabel: undefined, onAction: undefined });
    } else {
      toast.update(toastId, {
        kind: 'error',
        message: `${ids.length - failedIds.length} deleted, ${failedIds.length} failed`,
        actionLabel: 'Retry failed',
        onAction: () => void bulkDelete(failedIds),
      });
    }
    setBulkBusy(false);
  }, [toast, loadData]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const filtered = useMemo(() => useCases.filter((item) => {
    const text = `${item.id} ${item.name} ${item.department} ${item.stakeholder} ${item.description} ${item.notes}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (statusFilter === 'All' || item.status === statusFilter) &&
      (deptFilter === 'All' || item.department === deptFilter);
  }), [useCases, search, statusFilter, deptFilter]);

  const [sortKey, setSortKey] = useState<SortableKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: SortableKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const numeric = sortKey === 'value_amount' || sortKey === 'score';
    const dateLike = sortKey === 'updated' || sortKey === 'end_date';
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: string | number = a[sortKey] ?? '';
      let bv: string | number = b[sortKey] ?? '';
      if (numeric) { av = parseFloat(String(av)) || 0; bv = parseFloat(String(bv)) || 0; }
      else if (dateLike) { av = new Date(String(av)).getTime() || 0; bv = new Date(String(bv)).getTime() || 0; }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const stats = useMemo(() => ({
    total: useCases.length,
    current: useCases.filter((i) => i.horizon === 'Current Quarter').length,
    future: useCases.filter((i) => i.horizon === 'Future Pipeline').length,
    liveOrProgress: useCases.filter((i) => ['Live', 'In Progress'].includes(i.status)).length,
  }), [useCases]);

  const departments = useMemo(() => ['All', ...Array.from(new Set(useCases.map((i) => i.department).filter(Boolean)))], [useCases]);

  const allVisibleSelected = isEditor && sorted.length > 0 && sorted.every((u) => selectedIds.has(u.id));
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) sorted.forEach((u) => next.delete(u.id));
      else sorted.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const openAddForm = useCallback(() => { setEditingItem(null); setFormOpen(true); }, []);
  const openItem = useCallback((item: UseCaseItem) => setActiveItem(item), []);

  // Global keyboard shortcuts: Ctrl/Cmd+K = command palette, Esc = close topmost panel.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        if (paletteOpen) { setPaletteOpen(false); return; }
        if (aiOpen) { setAiOpen(false); return; }
        if (formOpen) { setFormOpen(false); return; }
        if (activeItem) { setActiveItem(null); return; }
        if (selectedIds.size > 0) { clearSelection(); return; }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [paletteOpen, aiOpen, formOpen, activeItem, selectedIds, clearSelection]);

  return (
    <div className="min-h-screen bg-canvas p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Image src="/transcend-logo.png" alt="Transcend AI Labs" width={381} height={134} priority className="h-7 w-auto" />
            <div className="flex items-center gap-4">
              <AccessBadge role={userRole} />
              <div className="h-4 w-px bg-hairline" />
              <Button variant="outline" size="icon" onClick={() => void loadData()} disabled={loading} type="button" aria-label="Refresh">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              {isEditor && (
                <Button variant="outline" onClick={() => setAiOpen(true)} type="button">
                  <Bot className="h-4 w-4" /> AI Assistant
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight text-accent md:text-[40px]">Use Case Portfolio</h1>
              <p className="mt-2 max-w-xl text-base leading-6 text-ink-secondary">
                Every AI initiative across NETSOL — where it stands, who owns it, and what&apos;s next.
              </p>
            </div>
            <button
              type="button"
              onClick={openPalette}
              className="flex shrink-0 items-center gap-2 rounded-full border border-hairline bg-white px-4 py-2 text-sm text-ink-secondary transition hover:bg-[#FAFAFA]"
            >
              <Command className="h-4 w-4 opacity-60" />
              {modLabel}K to jump to any use case
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline xl:grid-cols-4">
          <div className="bg-white px-6 py-5">
            <p className="text-[34px] font-bold leading-none tracking-tight text-ink">{stats.total}</p>
            <p className="mt-2 text-sm text-ink-secondary">Total initiatives</p>
          </div>
          <div className="bg-white px-6 py-5">
            <p className="text-[34px] font-bold leading-none tracking-tight" style={{ color: 'var(--color-live)' }}>{stats.liveOrProgress}</p>
            <p className="mt-2 text-sm text-ink-secondary">Live or in progress</p>
          </div>
          <div className="bg-white px-6 py-5">
            <p className="text-[34px] font-bold leading-none tracking-tight text-accent">{stats.current}</p>
            <p className="mt-2 text-sm text-ink-secondary">Current quarter</p>
          </div>
          <div className="bg-white px-6 py-5">
            <p className="text-[34px] font-bold leading-none tracking-tight text-ink-tertiary">{stats.future}</p>
            <p className="mt-2 text-sm text-ink-secondary">Future pipeline</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row">
                <div className="relative flex-1 md:min-w-[280px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-tertiary" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search use cases, stakeholder, department..." className="h-11 pl-11" />
                </div>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full md:w-[170px]">
                  <option value="All">All statuses</option>
                  {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
                <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-11 w-full md:w-[170px]">
                  {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All departments' : d}</option>)}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-full bg-black/[0.04] p-1">
                  <button className={cn('inline-flex items-center rounded-full px-3 py-2 text-sm', view === 'table' ? 'border border-hairline bg-white text-ink' : 'text-ink-secondary')} onClick={() => setView('table')} type="button">
                    <Table2 className="mr-2 h-4 w-4" /> Table
                  </button>
                  <button className={cn('inline-flex items-center rounded-full px-3 py-2 text-sm', view === 'cards' ? 'border border-hairline bg-white text-ink' : 'text-ink-secondary')} onClick={() => setView('cards')} type="button">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Cards
                  </button>
                </div>
                {isEditor && (
                  <Button onClick={openAddForm} type="button">
                    <Plus className="h-4 w-4" /> Add use case
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-tertiary">
              Tip: click a status or priority to change it instantly. Press <kbd className="rounded border border-hairline px-1 py-0.5">{modLabel}K</kbd> to jump to any use case, <kbd className="rounded border border-hairline px-1 py-0.5">Esc</kbd> to close panels.
            </p>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {view === 'table' ? (
            <motion.div key="table" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="border-b border-hairline-soft">
                      <tr>
                        {isEditor && (
                          <th className="w-10 px-4 py-3.5">
                            <button type="button" onClick={toggleSelectAllVisible} aria-label={allVisibleSelected ? 'Deselect all visible' : 'Select all visible'}>
                              {allVisibleSelected ? <CheckSquare className="h-4 w-4 text-ink" /> : <Square className="h-4 w-4 text-ink-tertiary" />}
                            </button>
                          </th>
                        )}
                        <SortHeader label="Use Case" sortKey="name" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Department" sortKey="department" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Stakeholder" sortKey="stakeholder" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Status" sortKey="status" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Priority" sortKey="priority" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        {isEditor && <SortHeader label="Value" sortKey="value_amount" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />}
                        {isEditor && <SortHeader label="Score" sortKey="score" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />}
                        <SortHeader label="Horizon" sortKey="horizon" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="End Date" sortKey="end_date" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <SortHeader label="Updated" sortKey="updated" activeKey={sortKey} dir={sortDir} onSort={toggleSort} />
                        <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-ink-tertiary text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((item) => {
                        const signs = getValueSigns(item.value_amount);
                        const selected = selectedIds.has(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={cn('cursor-pointer border-t border-hairline-soft transition-colors hover:bg-[#FAFAFA]', selected && 'bg-[#F2F7F9]')}
                            onClick={() => setActiveItem(item)}
                          >
                            {isEditor && (
                              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <button type="button" onClick={() => toggleSelect(item.id)} aria-label={selected ? 'Deselect' : 'Select'}>
                                  {selected ? <CheckSquare className="h-4 w-4 text-ink" /> : <Square className="h-4 w-4 text-ink-tertiary" />}
                                </button>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <div className="text-left">
                                <div className="font-semibold text-ink">{item.name}</div>
                                <div className="mt-0.5 text-xs text-ink-tertiary">{item.id}</div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-secondary">{item.department}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-secondary">{item.stakeholder}</td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <StatusIndicator value={item.status} isEditor={isEditor} onChange={(v) => void applyFieldChange(item, 'status', v)} />
                            </td>
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                              <PriorityIndicator value={item.priority} isEditor={isEditor} onChange={(v) => void applyFieldChange(item, 'priority', v)} />
                            </td>
                            {isEditor && <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold" style={{ color: 'var(--color-live)' }}>{signs}</td>}
                            {isEditor && <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-secondary">{item.score ? `${item.score}/100` : '—'}</td>}
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-secondary">{item.horizon}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-tertiary">{item.end_date || '—'}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-ink-tertiary">{formatUpdated(item.updated)}</td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setActiveItem(item)} type="button">View</Button>
                                {isEditor && (
                                  <>
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setFormOpen(true); }} type="button" aria-label="Edit use case"><Pencil className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => void deleteItem(item.id)} type="button" aria-label="Delete use case">
                                      <Trash2 className="h-4 w-4 text-[#C4384A]" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {loading && <div className="p-8 text-center text-ink-tertiary">Loading data...</div>}
                {!loading && filtered.length === 0 && <div className="p-12 text-center text-ink-tertiary">No use cases match the current filters.</div>}
              </Card>
            </motion.div>
          ) : (
            <motion.div key="cards" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const signs = getValueSigns(item.value_amount);
                const selected = selectedIds.has(item.id);
                return (
                  <Card key={item.id} className={cn('relative flex h-full flex-col transition-shadow hover:shadow-sm', selected && 'ring-2 ring-accent')}>
                    {isEditor && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                        className="absolute left-4 top-4 z-10 rounded-md bg-white/95 p-0.5"
                        aria-label={selected ? 'Deselect' : 'Select'}
                      >
                        {selected ? <CheckSquare className="h-4 w-4 text-ink" /> : <Square className="h-4 w-4 text-ink-tertiary" />}
                      </button>
                    )}
                    <CardHeader className={cn('pb-3', isEditor && 'pl-12')}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="leading-6">{item.name}</CardTitle>
                          <CardDescription className="mt-1">{item.id}</CardDescription>
                        </div>
                        <ChevronRight className="h-5 w-5 text-ink-tertiary" />
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
                      <div className="flex flex-wrap items-center gap-4">
                        <StatusIndicator value={item.status} isEditor={isEditor} onChange={(v) => void applyFieldChange(item, 'status', v)} />
                        <PriorityIndicator value={item.priority} isEditor={isEditor} onChange={(v) => void applyFieldChange(item, 'priority', v)} />
                        {isEditor && signs && <span className="text-sm font-semibold" style={{ color: 'var(--color-live)' }}>{signs}</span>}
                        {isEditor && item.score && <span className="text-sm text-ink-secondary">{item.score}/100</span>}
                      </div>
                      {item.description && <ClampedText text={item.description} />}
                      <div className="grid gap-3 text-sm text-ink-secondary">
                        <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-ink-tertiary" /> {item.department}</div>
                        <div className="flex items-center gap-2"><User2 className="h-4 w-4 text-ink-tertiary" /> {item.stakeholder}</div>
                        <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-ink-tertiary" /> {item.horizon}</div>
                      </div>
                      <div className="mt-auto flex gap-2 pt-2">
                        <Button className="flex-1" onClick={() => setActiveItem(item)} type="button">Open details</Button>
                        {isEditor && (
                          <>
                            <Button variant="outline" size="icon" onClick={() => { setEditingItem(item); setFormOpen(true); }} type="button" aria-label="Edit use case"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="outline" size="icon" onClick={() => void deleteItem(item.id)} type="button" aria-label="Delete use case">
                              <Trash2 className="h-4 w-4 text-[#C4384A]" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <GanttChart items={filtered} />

        <UseCaseForm open={formOpen} onOpenChange={setFormOpen} onSave={saveItem} editingItem={editingItem} modLabel={modLabel} />

        <AIPanel
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          allUseCases={useCases}
          onScoreSaved={(id, score) => void handleScoreSaved(id, score)}
        />

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          useCases={useCases}
          onOpenItem={(item) => { openItem(item); setPaletteOpen(false); }}
          onAddNew={() => { openAddForm(); setPaletteOpen(false); }}
          isEditor={isEditor}
          modLabel={modLabel}
        />

        <Drawer open={Boolean(activeItem)} onClose={() => setActiveItem(null)}>
          {activeItem && (
            <>
              <div className="border-b border-hairline p-6">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary">{activeItem.id}</div>
                    <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">{activeItem.name}</h2>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setActiveItem(null)} type="button"><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <StatusIndicator value={activeItem.status} isEditor={isEditor} onChange={(v) => { void applyFieldChange(activeItem, 'status', v); setActiveItem((cur) => (cur ? { ...cur, status: v } : cur)); }} />
                  <PriorityIndicator value={activeItem.priority} isEditor={isEditor} onChange={(v) => { void applyFieldChange(activeItem, 'priority', v); setActiveItem((cur) => (cur ? { ...cur, priority: v } : cur)); }} />
                  <span className="text-sm text-ink-secondary">{activeItem.horizon}</span>
                  {isEditor && getValueSigns(activeItem.value_amount) && (
                    <span className="text-sm font-semibold" style={{ color: 'var(--color-live)' }}>{getValueSigns(activeItem.value_amount)}</span>
                  )}
                  {isEditor && activeItem.score && (
                    <span className="text-sm text-ink-secondary">Score: {activeItem.score}/100</span>
                  )}
                </div>
              </div>
              <div className="space-y-6 p-6">
                <div className="overflow-hidden rounded-2xl border border-hairline">
                  <div className="flex items-center justify-between border-b border-hairline-soft px-5 py-3.5">
                    <span className="text-sm text-ink-secondary">Department</span>
                    <span className="text-sm font-medium text-ink">{activeItem.department}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-hairline-soft px-5 py-3.5">
                    <span className="text-sm text-ink-secondary">Primary stakeholder</span>
                    <span className="text-sm font-medium text-ink">{activeItem.stakeholder}</span>
                  </div>
                  {activeItem.start_date && (
                    <div className="flex items-center justify-between border-b border-hairline-soft px-5 py-3.5">
                      <span className="text-sm text-ink-secondary">Start date</span>
                      <span className="text-sm font-medium text-ink">{activeItem.start_date}</span>
                    </div>
                  )}
                  {activeItem.end_date && (
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm text-ink-secondary">End date</span>
                      <span className="text-sm font-medium text-ink">{activeItem.end_date}</span>
                    </div>
                  )}
                  {isEditor && activeItem.value_amount && (
                    <div className="flex items-center justify-between border-t border-hairline-soft px-5 py-3.5">
                      <span className="text-sm text-ink-secondary">Estimated value</span>
                      <span className="text-sm font-medium text-ink">
                        ${Number(activeItem.value_amount).toLocaleString()} <span className="ml-1" style={{ color: 'var(--color-live)' }}>{getValueSigns(activeItem.value_amount)}</span>
                      </span>
                    </div>
                  )}
                </div>

                {(activeItem.description || activeItem.impact || activeItem.notes) && (
                  <div className="overflow-hidden rounded-2xl border border-hairline">
                    {activeItem.description && (
                      <div className="border-b border-hairline-soft px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-2">Description</p>
                        <p className="text-[15px] leading-7 text-ink-secondary">{activeItem.description}</p>
                      </div>
                    )}
                    {activeItem.impact && (
                      <div className="border-b border-hairline-soft px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-2">Expected impact</p>
                        <p className="text-[15px] leading-7 text-ink-secondary">{activeItem.impact}</p>
                      </div>
                    )}
                    {activeItem.notes && (
                      <div className="px-5 py-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-2">Notes and execution context</p>
                        <p className="text-[15px] leading-7 text-ink-secondary">{activeItem.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeItem.brd_url && (
                  <div className="rounded-2xl border border-hairline px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-tertiary mb-3">BRD Document</p>
                    <a href={activeItem.brd_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" type="button"><FileText className="h-4 w-4" /> View BRD</Button>
                    </a>
                  </div>
                )}

                {isEditor && (
                  <div className="flex items-center gap-3 pt-2">
                    <Button disabled={saving} onClick={() => { setEditingItem(activeItem); setFormOpen(true); setActiveItem(null); }} type="button">
                      <Pencil className="h-4 w-4" /> Edit use case
                    </Button>
                    <Button variant="outline" onClick={() => setAiOpen(true)} type="button">
                      <Bot className="h-4 w-4" /> AI Assistant
                    </Button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void deleteItem(activeItem.id)}
                      className="ml-auto text-sm font-medium text-[#C4384A] transition hover:opacity-70 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </Drawer>

        <AnimatePresence>
          {isEditor && selectedIds.size > 0 && (
            <BulkActionBar
              key="bulk-bar"
              count={selectedIds.size}
              busy={bulkBusy}
              onSetStatus={(v) => void bulkSetField(Array.from(selectedIds), 'status', v)}
              onSetPriority={(v) => void bulkSetField(Array.from(selectedIds), 'priority', v)}
              onDelete={() => void bulkDelete(Array.from(selectedIds))}
              onClear={clearSelection}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function UseCasePortfolioApp() {
  return (
    <ToastProvider>
      <UseCasePortfolioAppInner />
    </ToastProvider>
  );
}
