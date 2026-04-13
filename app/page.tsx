"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, LayoutGrid, Table2, CalendarDays, Building2, User2,
  Sparkles, Target, ChevronRight, X, Pencil, Briefcase, Clock3, Shield, Eye,
  RefreshCw, Trash2, BarChart2, type LucideIcon,
} from 'lucide-react';

const EDITOR_SECRET = 'AIlabs2026';

type UserRole = 'viewer' | 'editor';
type ViewMode = 'table' | 'cards';

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
};

const demoUseCases: UseCaseItem[] = [
  {
    id: 'UC-001', name: 'Autobid RFP Response Automation', department: 'Pre-Sales', stakeholder: 'Muneeb',
    status: 'In Progress', horizon: 'Current Quarter', priority: 'High',
    description: 'Automates first-draft RFP responses using approved content blocks, reusable answer libraries, and guided prompt workflows.',
    impact: 'Reduce proposal preparation time and improve consistency in responses.',
    notes: 'Needs stronger export and library management workflow.',
    updated: '2026-04-09', start_date: '2026-03-01', end_date: '2026-06-30',
  },
  {
    id: 'UC-002', name: 'Transcend Chatbot', department: 'Product', stakeholder: 'Fatima Mirza',
    status: 'In Discovery', horizon: 'Current Quarter', priority: 'High',
    description: 'Client-facing helpbot for Transcend Finance users to answer system questions and reduce repetitive support traffic.',
    impact: 'Lower support volume and improve self-service for clients.',
    notes: 'Need to define scope boundaries and escalation logic.',
    updated: '2026-04-08', start_date: '2026-04-01', end_date: '2026-07-31',
  },
  {
    id: 'UC-003', name: 'AI BI Insights for Wholesale Finance', department: 'Strategy', stakeholder: 'Fatima Mirza',
    status: 'Planned', horizon: 'Future Pipeline', priority: 'Medium',
    description: 'Executive dashboard layer for wholesale finance with natural-language insight generation and strategic KPI summaries.',
    impact: 'Help executives answer business questions quickly without depending on analysts.',
    notes: 'Best positioned as a strategic differentiator.',
    updated: '2026-04-06', start_date: '2026-07-01', end_date: '2026-12-31',
  },
  {
    id: 'UC-004', name: 'Dealer Product Recommendation Engine', department: 'Sales', stakeholder: 'Fatima Mirza',
    status: 'Idea', horizon: 'Future Pipeline', priority: 'Medium',
    description: 'Recommends relevant finance products, contract types, and add-ons to improve dealer-side sales conversations.',
    impact: 'Drive smarter assisted selling with limited first-interaction customer data.',
    notes: 'Should stay recommendation-first, not advisory-heavy.',
    updated: '2026-04-04', start_date: '2026-09-01', end_date: '2027-03-31',
  },
];

const statusOptions = ['Idea', 'In Discovery', 'Planned', 'In Progress', 'Blocked', 'Live', 'On Hold'] as const;
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'] as const;
const horizonOptions = ['Current Quarter', 'Next Quarter', 'Future Pipeline'] as const;

const statusStyles: Record<string, string> = {
  Idea: 'bg-slate-100 text-slate-700 border-slate-200',
  'In Discovery': 'bg-blue-100 text-blue-700 border-blue-200',
  Planned: 'bg-violet-100 text-violet-700 border-violet-200',
  'In Progress': 'bg-amber-100 text-amber-700 border-amber-200',
  Blocked: 'bg-rose-100 text-rose-700 border-rose-200',
  Live: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

const statusBarColors: Record<string, string> = {
  Idea: 'bg-slate-400',
  'In Discovery': 'bg-blue-400',
  Planned: 'bg-violet-400',
  'In Progress': 'bg-amber-400',
  Blocked: 'bg-rose-400',
  Live: 'bg-emerald-400',
  'On Hold': 'bg-zinc-400',
};

const priorityStyles: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type SurfaceProps = { className?: string; children: ReactNode };

function Card({ className, children }: SurfaceProps) {
  return <div className={cn('rounded-3xl bg-white shadow-sm', className)}>{children}</div>;
}
function CardHeader({ className, children }: SurfaceProps) {
  return <div className={cn('p-6 pb-3', className)}>{children}</div>;
}
function CardTitle({ className, children }: SurfaceProps) {
  return <h3 className={cn('text-lg font-semibold text-slate-900', className)}>{children}</h3>;
}
function CardDescription({ className, children }: SurfaceProps) {
  return <p className={cn('text-sm text-slate-500', className)}>{children}</p>;
}
function CardContent({ className, children }: SurfaceProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary' | 'danger';
type ButtonSize = 'default' | 'icon';
type ButtonProps = { className?: string; variant?: ButtonVariant; size?: ButtonSize; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  };
  const sizes: Record<ButtonSize, string> = { default: 'h-10 px-4 py-2', icon: 'h-10 w-10 p-0' };
  return (
    <button className={cn('inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

function Input({ className, ...props }: { className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300', className)} {...props} />;
}

function Textarea({ className, ...props }: { className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300', className)} {...props} />;
}

function Select({ className, children, ...props }: { className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-300', className)} {...props}>{children}</select>;
}

function Badge({ className, children }: SurfaceProps) {
  return <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium', className)}>{children}</span>;
}

function StatCard({ title, value, icon: Icon, subtitle }: { title: string; value: number; icon: LucideIcon; subtitle: string }) {
  return (
    <Card className="border-0">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccessBadge({ role }: { role: UserRole }) {
  const isEditor = role === 'editor';
  return (
    <Badge className={cn('border', isEditor ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700')}>
      {isEditor ? <Shield className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
      {isEditor ? 'Editor access' : 'Viewer access'}
    </Badge>
  );
}

type ModalProps = { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; footer?: ReactNode };

function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              {description && <p className="mt-1 text-sm text-slate-300">{description}</p>}
            </div>
            <Button size="icon" variant="secondary" onClick={onClose} type="button"><X className="h-4 w-4" /></Button>
          </div>
        </div>
        <div>{children}</div>
        {footer && <div className="border-t bg-slate-50 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div className={cn('fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div className={cn('absolute inset-0 bg-slate-900/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
      <div className={cn('absolute right-0 top-0 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl transition-transform', open ? 'translate-x-0' : 'translate-x-full')}>
        {children}
      </div>
    </div>
  );
}

// ── Gantt Chart ──────────────────────────────────────────────────────────────

function GanttChart({ items }: { items: UseCaseItem[] }) {
  const validItems = items.filter((i) => i.start_date && i.end_date);
  if (validItems.length === 0) return (
    <Card className="rounded-[28px]">
      <CardContent className="p-8 text-center text-slate-500">No timeline data available. Add start and end dates to use cases.</CardContent>
    </Card>
  );

  const allDates = validItems.flatMap((i) => [new Date(i.start_date), new Date(i.end_date)]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Round to month boundaries
  minDate.setDate(1);
  maxDate.setMonth(maxDate.getMonth() + 1);
  maxDate.setDate(0);

  const totalDays = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);

  // Build month labels
  const months: { label: string; left: number; width: number }[] = [];
  const cursor = new Date(minDate);
  while (cursor <= maxDate) {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const left = Math.max(0, (monthStart.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    const end = Math.min(100, (monthEnd.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100);
    months.push({
      label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      left,
      width: end - left,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // Today marker
  const today = new Date();
  const todayPct = Math.min(100, Math.max(0, (today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100));
  const showToday = today >= minDate && today <= maxDate;

  return (
    <Card className="overflow-hidden rounded-[28px]">
      <div className="border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-slate-500" />
          <h3 className="font-semibold text-slate-900">Timeline</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <div style={{ minWidth: '600px' }}>
            {/* Month headers */}
            <div className="relative mb-3 ml-48 h-6">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute text-xs text-slate-400"
                  style={{ left: `${m.left}%`, width: `${m.width}%` }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Grid + bars */}
            <div className="relative ml-48 space-y-3">
              {/* Month grid lines */}
              {months.map((m, i) => (
                <div
                  key={i}
                  className="pointer-events-none absolute top-0 bottom-0 border-l border-slate-100"
                  style={{ left: `${m.left}%` }}
                />
              ))}

              {/* Today line */}
              {showToday && (
                <div
                  className="pointer-events-none absolute top-0 bottom-0 z-10 border-l-2 border-indigo-400"
                  style={{ left: `${todayPct}%` }}
                >
                  <span className="absolute -top-6 -translate-x-1/2 rounded bg-indigo-400 px-1.5 py-0.5 text-xs text-white">Today</span>
                </div>
              )}

              {validItems.map((item) => {
                const start = new Date(item.start_date);
                const end = new Date(item.end_date);
                const leftPct = (start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100;
                const widthPct = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) / totalDays * 100;
                const barColor = statusBarColors[item.status] ?? 'bg-slate-400';

                return (
                  <div key={item.id} className="flex items-center gap-0">
                    {/* Label — sits to the LEFT of the ml-48 container, so we use negative offset */}
                    <div className="absolute -ml-48 w-44 truncate pr-3 text-right text-sm text-slate-700" title={item.name}>
                      {item.name}
                    </div>
                    {/* Bar row */}
                    <div className="relative h-8 w-full rounded-xl bg-slate-50">
                     <div
  className={cn('absolute h-full rounded-xl opacity-90 transition-all cursor-pointer group/bar', barColor)}
  style={{ left: `${Math.max(0, leftPct)}%`, width: `${Math.min(100 - Math.max(0, leftPct), widthPct)}%` }}
>
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:flex z-20 flex-col items-center">
    <div className="rounded-2xl bg-white border border-slate-200 shadow-lg px-4 py-2 text-xs text-slate-700 whitespace-nowrap">
      <p className="font-semibold text-slate-900">{item.status}</p>
      <p className="text-slate-500 mt-0.5">{item.start_date} → {item.end_date}</p>
    </div>
    <div className="w-2 h-2 bg-white border-r border-b border-slate-200 rotate-45 -mt-1" />
  </div>
</div>
/
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/bar:flex z-20 flex-col items-center">
  <div className="rounded-2xl bg-slate-900 shadow-xl px-4 py-2.5 text-xs whitespace-nowrap">
    <p className="font-semibold text-white">{item.status}</p>
    <p className="text-slate-400 mt-0.5">{item.start_date} → {item.end_date}</p>
  </div>
  <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5" />
</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

const emptyForm: UseCaseItem = {
  id: '', name: '', department: '', stakeholder: '',
  status: 'Idea', horizon: 'Future Pipeline', priority: 'Medium',
  description: '', impact: '', notes: '',
  updated: new Date().toISOString().slice(0, 10),
  start_date: '', end_date: '',
};

function UseCaseForm({ open, onOpenChange, onSave, editingItem }: {
  open: boolean; onOpenChange: (v: boolean) => void; onSave: (item: UseCaseItem) => void; editingItem: UseCaseItem | null;
}) {
  const [form, setForm] = useState<UseCaseItem>(emptyForm);
  useEffect(() => { setForm(editingItem ?? emptyForm); }, [editingItem, open]);
  const update = (key: keyof UseCaseItem, value: string) => setForm((p) => ({ ...p, [key]: value }));

  return (
    <Modal
      open={open} onClose={() => onOpenChange(false)}
      title={editingItem ? 'Edit use case' : 'Add new use case'}
      description="Keep updates lightweight while capturing enough detail for reviews, planning, and execution."
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">Cancel</Button>
          <Button onClick={() => { if (!form.id || !form.name) return; onSave({ ...form }); onOpenChange(false); }} type="button">
            {editingItem ? 'Save changes' : 'Create use case'}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Use Case ID</label>
          <Input value={form.id} onChange={(e) => update('id', e.target.value)} placeholder="UC-005" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Department</label>
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
</Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Use Case Name</label>
          <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Collections optimization assistant" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Primary Stakeholder</label>
          <Input value={form.stakeholder} onChange={(e) => update('stakeholder', e.target.value)} placeholder="Fatima Mirza" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Last Updated</label>
          <Input type="date" value={form.updated} onChange={(e) => update('updated', e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
          <Select value={form.status} onChange={(e) => update('status', e.target.value)}>
            {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <Select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            {priorityOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Portfolio Horizon</label>
          <Select value={form.horizon} onChange={(e) => update('horizon', e.target.value)}>
            {horizonOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Start Date</label>
          <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">End Date</label>
          <Input type="date" value={form.end_date} onChange={(e) => update('end_date', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
          <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="min-h-[110px]" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Expected Impact</label>
          <Textarea value={form.impact} onChange={(e) => update('impact', e.target.value)} className="min-h-[90px]" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
          <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} className="min-h-[90px]" />
        </div>
      </div>
    </Modal>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function UseCasePortfolioApp() {
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
  const [notice, setNotice] = useState('');
  const [usingDemo, setUsingDemo] = useState(true);

  const isEditor = userRole === 'editor';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('editor') === EDITOR_SECRET) setUserRole('editor');
    void loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const res = await fetch('/api/usecases');
      if (!res.ok) throw new Error('Failed');
      const data: UseCaseItem[] = await res.json();
      if (data.length > 0) { setUseCases(data); setUsingDemo(false); }
      else { setUseCases(demoUseCases); setUsingDemo(true); }
    } catch {
      setUseCases(demoUseCases);
      setUsingDemo(true);
      setNotice('Could not connect to database. Showing demo data.');
    }
    setLoading(false);
  }, []);

  const saveItem = async (item: UseCaseItem) => {
    setSaving(true); setNotice('');
    try {
      const res = await fetch('/api/usecases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error('Failed');
      await loadData();
      setNotice('Saved successfully.');
    } catch { setNotice('Could not save. Please try again.'); }
    setSaving(false); setEditingItem(null);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this use case?')) return;
    setSaving(true); setNotice('');
    try {
      const res = await fetch('/api/usecases', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed');
      setActiveItem(null);
      await loadData();
      setNotice('Deleted successfully.');
    } catch { setNotice('Could not delete. Please try again.'); }
    setSaving(false);
  };

  const filtered = useMemo(() => useCases.filter((item) => {
    const text = `${item.id} ${item.name} ${item.department} ${item.stakeholder} ${item.description} ${item.notes}`.toLowerCase();
    return text.includes(search.toLowerCase()) &&
      (statusFilter === 'All' || item.status === statusFilter) &&
      (deptFilter === 'All' || item.department === deptFilter);
  }), [useCases, search, statusFilter, deptFilter]);

  const stats = useMemo(() => ({
    total: useCases.length,
    current: useCases.filter((i) => i.horizon === 'Current Quarter').length,
    future: useCases.filter((i) => i.horizon === 'Future Pipeline').length,
    liveOrProgress: useCases.filter((i) => ['Live', 'In Progress'].includes(i.status)).length,
  }), [useCases]);

  const departments = useMemo(() => ['All', ...Array.from(new Set(useCases.map((i) => i.department).filter(Boolean)))], [useCases]);

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-white/90">
                <Sparkles className="h-4 w-4" /> Use Case Portfolio
              </div>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">AI Use Case Portfolio</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Centralized view of ongoing initiatives, pipeline opportunities, and ownership across the organization.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 md:items-end">
              <AccessBadge role={userRole} />
              {isEditor && (
                <Button className="border border-white/30 bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => { setEditingItem(null); setFormOpen(true); }} type="button">
                  <Plus className="h-4 w-4" /> Add use case
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Notice */}
        {notice && (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-slate-600">
              <span>{notice}</span>
              <Button variant="outline" onClick={() => void loadData()} type="button">
                <RefreshCw className="h-4 w-4" /> Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {usingDemo && !notice && (
          <Card>
            <CardContent className="p-4 text-sm text-slate-500">
              Showing demo data — live Google Sheets data will appear once the API is connected.
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total use cases" value={stats.total} subtitle="Across current and future portfolio" icon={Briefcase} />
          <StatCard title="Current quarter" value={stats.current} subtitle="Active focus for review" icon={Target} />
          <StatCard title="Future pipeline" value={stats.future} subtitle="Ideas and planned initiatives" icon={Clock3} />
          <StatCard title="Moving forward" value={stats.liveOrProgress} subtitle="Live or currently in progress" icon={CalendarDays} />
        </div>

        {/* Filters */}
        <Card className="rounded-[28px]">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search use cases, stakeholder, department..." className="h-11 pl-11" />
                </div>
                <div className="relative">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full pl-10 md:w-[180px]">
                    <option value="All">All statuses</option>
                    {statusOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                </div>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-11 w-full pl-10 md:w-[180px]">
                    {departments.map((d) => <option key={d} value={d}>{d === 'All' ? 'All departments' : d}</option>)}
                  </Select>
                </div>
              </div>
              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button className={cn('inline-flex items-center rounded-xl px-3 py-2 text-sm', view === 'table' ? 'bg-white shadow-sm' : 'text-slate-600')} onClick={() => setView('table')} type="button">
                  <Table2 className="mr-2 h-4 w-4" /> Table
                </button>
                <button className={cn('inline-flex items-center rounded-xl px-3 py-2 text-sm', view === 'cards' ? 'bg-white shadow-sm' : 'text-slate-600')} onClick={() => setView('cards')} type="button">
                  <LayoutGrid className="mr-2 h-4 w-4" /> Cards
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table / Cards */}
        <AnimatePresence mode="wait">
          {view === 'table' ? (
            <motion.div key="table" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <Card className="overflow-hidden rounded-[28px]">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-50 text-sm text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">Use Case</th>
                        <th className="px-6 py-4 font-medium">Department</th>
                        <th className="px-6 py-4 font-medium">Stakeholder</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Priority</th>
                        <th className="px-6 py-4 font-medium">Horizon</th>
                        <th className="px-6 py-4 font-medium">Updated</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/70">
                          <td className="px-6 py-4">
                            <button className="group text-left" onClick={() => setActiveItem(item)} type="button">
                              <div className="font-medium text-slate-900 group-hover:text-slate-700">{item.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{item.id}</div>
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{item.department}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{item.stakeholder}</td>
                          <td className="px-6 py-4"><Badge className={cn('border', statusStyles[item.status])}>{item.status}</Badge></td>
                          <td className="px-6 py-4"><Badge className={cn('border', priorityStyles[item.priority])}>{item.priority}</Badge></td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">{item.horizon}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{item.updated}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setActiveItem(item)} type="button">View</Button>
                              {isEditor && (
                                <>
                                  <Button variant="ghost" onClick={() => { setEditingItem(item); setFormOpen(true); }} type="button">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" onClick={() => void deleteItem(item.id)} type="button" className="text-rose-600 hover:bg-rose-50">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading && <div className="p-8 text-center text-slate-500">Loading data...</div>}
                {!loading && filtered.length === 0 && <div className="p-12 text-center text-slate-500">No use cases match the current filters.</div>}
              </Card>
            </motion.div>
          ) : (
            <motion.div key="cards" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <Card key={item.id} className="rounded-[28px] transition-transform hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="leading-6">{item.name}</CardTitle>
                        <CardDescription className="mt-1">{item.id}</CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={cn('border', statusStyles[item.status])}>{item.status}</Badge>
                      <Badge className={cn('border', priorityStyles[item.priority])}>{item.priority}</Badge>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                    <div className="grid gap-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {item.department}</div>
                      <div className="flex items-center gap-2"><User2 className="h-4 w-4" /> {item.stakeholder}</div>
                      <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {item.horizon}</div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" onClick={() => setActiveItem(item)} type="button">Open details</Button>
                      {isEditor && (
                        <>
                          <Button variant="outline" onClick={() => { setEditingItem(item); setFormOpen(true); }} type="button">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" onClick={() => void deleteItem(item.id)} type="button" className="text-rose-600 border-rose-200 hover:bg-rose-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gantt Chart */}
        <GanttChart items={filtered} />

        {/* Form modal */}
        <UseCaseForm open={formOpen} onOpenChange={setFormOpen} onSave={(item) => void saveItem(item)} editingItem={editingItem} />

        {/* Detail drawer */}
        <Drawer open={Boolean(activeItem)} onClose={() => setActiveItem(null)}>
          {activeItem && (
            <>
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-300">{activeItem.id}</div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{activeItem.name}</h2>
                    <p className="mt-1 text-sm text-slate-300">Detailed portfolio view for planning, review, and execution.</p>
                  </div>
                  <Button size="icon" variant="secondary" onClick={() => setActiveItem(null)} type="button"><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn('border border-white/20', statusStyles[activeItem.status])}>{activeItem.status}</Badge>
                  <Badge className={cn('border border-white/20', priorityStyles[activeItem.priority])}>{activeItem.priority}</Badge>
                  <Badge className="border border-white/20 bg-white/10 text-white">{activeItem.horizon}</Badge>
                </div>
              </div>
              <div className="space-y-6 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border border-slate-200 shadow-none">
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">Department</p>
                      <p className="mt-2 text-base font-medium text-slate-900">{activeItem.department}</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-slate-200 shadow-none">
                    <CardContent className="p-5">
                      <p className="text-sm text-slate-500">Primary stakeholder</p>
                      <p className="mt-2 text-base font-medium text-slate-900">{activeItem.stakeholder}</p>
                    </CardContent>
                  </Card>
                  {activeItem.start_date && (
                    <Card className="border border-slate-200 shadow-none">
                      <CardContent className="p-5">
                        <p className="text-sm text-slate-500">Start date</p>
                        <p className="mt-2 text-base font-medium text-slate-900">{activeItem.start_date}</p>
                      </CardContent>
                    </Card>
                  )}
                  {activeItem.end_date && (
                    <Card className="border border-slate-200 shadow-none">
                      <CardContent className="p-5">
                        <p className="text-sm text-slate-500">End date</p>
                        <p className="mt-2 text-base font-medium text-slate-900">{activeItem.end_date}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <Card className="border border-slate-200 shadow-none">
                  <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                  <CardContent><p className="leading-7 text-slate-700">{activeItem.description}</p></CardContent>
                </Card>
                <Card className="border border-slate-200 shadow-none">
                  <CardHeader><CardTitle>Expected impact</CardTitle></CardHeader>
                  <CardContent><p className="leading-7 text-slate-700">{activeItem.impact}</p></CardContent>
                </Card>
                <Card className="border border-slate-200 shadow-none">
                  <CardHeader><CardTitle>Notes and execution context</CardTitle></CardHeader>
                  <CardContent><p className="leading-7 text-slate-700">{activeItem.notes}</p></CardContent>
                </Card>
                {isEditor && (
                  <div className="flex gap-3">
                    <Button disabled={saving} onClick={() => { setEditingItem(activeItem); setFormOpen(true); }} type="button">
                      <Pencil className="h-4 w-4" /> Edit use case
                    </Button>
                    <Button variant="danger" disabled={saving} onClick={() => void deleteItem(activeItem.id)} type="button">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </Drawer>
      </div>
    </div>
  );
}
