"use client";

import React, { useEffect, useMemo, useState } from 'react';
import type {
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  Table2,
  CalendarDays,
  Building2,
  User2,
  Sparkles,
  Target,
  ChevronRight,
  X,
  Pencil,
  Briefcase,
  Clock3,
  LogIn,
  LogOut,
  Shield,
  Eye,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { createClient, type Session } from '@supabase/supabase-js';

type UserRole = 'viewer' | 'editor' | 'admin' | null;
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
  created_by?: string;
};

type SurfaceProps = {
  className?: string;
  children: ReactNode;
};

const demoUseCases: UseCaseItem[] = [
  {
    id: 'UC-001',
    name: 'Autobid RFP Response Automation',
    department: 'Pre-Sales',
    stakeholder: 'Muneeb',
    status: 'In Progress',
    horizon: 'Current Quarter',
    priority: 'High',
    description:
      'Automates first-draft RFP responses using approved content blocks, reusable answer libraries, and guided prompt workflows.',
    impact: 'Reduce proposal preparation time and improve consistency in responses.',
    notes: 'Needs stronger export and library management workflow.',
    updated: '2026-04-09',
  },
  {
    id: 'UC-002',
    name: 'Transcend Chatbot',
    department: 'Product',
    stakeholder: 'Fatima Mirza',
    status: 'In Discovery',
    horizon: 'Current Quarter',
    priority: 'High',
    description:
      'Client-facing helpbot for Transcend Finance users to answer system questions and reduce repetitive support traffic.',
    impact: 'Lower support volume and improve self-service for clients.',
    notes: 'Need to define scope boundaries and escalation logic.',
    updated: '2026-04-08',
  },
  {
    id: 'UC-003',
    name: 'AI BI Insights for Wholesale Finance',
    department: 'Strategy',
    stakeholder: 'Fatima Mirza',
    status: 'Planned',
    horizon: 'Future Pipeline',
    priority: 'Medium',
    description:
      'Executive dashboard layer for wholesale finance with natural-language insight generation and strategic KPI summaries.',
    impact: 'Help executives answer business questions quickly without depending on analysts.',
    notes: 'Best positioned as a strategic differentiator.',
    updated: '2026-04-06',
  },
  {
    id: 'UC-004',
    name: 'Dealer Product Recommendation Engine',
    department: 'Sales',
    stakeholder: 'Fatima Mirza',
    status: 'Idea',
    horizon: 'Future Pipeline',
    priority: 'Medium',
    description:
      'Recommends relevant finance products, contract types, and add-ons to improve dealer-side sales conversations.',
    impact: 'Drive smarter assisted selling with limited first-interaction customer data.',
    notes: 'Should stay recommendation-first, not advisory-heavy.',
    updated: '2026-04-04',
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

const priorityStyles: Record<string, string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-blue-100 text-blue-700 border-blue-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
  Critical: 'bg-rose-100 text-rose-700 border-rose-200',
};
const supabaseUrl = "https://cflgpbcqyxnzbxzlvfuk.supabase.co";
const supabaseAnonKey = "sb_publishable_lqYENJ8RnyBlYhCKSFy3kg_aa7PeiOa";

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const hasSupabaseEnv = true;

function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

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

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'secondary';
type ButtonSize = 'default' | 'icon';

type ButtonProps = {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

function Button({ className, variant = 'default', size = 'default', children, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  };

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 px-4 py-2',
    icon: 'h-10 w-10 p-0',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Input({ className, ...props }: { className?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300',
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: { className?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-300',
        className
      )}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: { className?: string; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-300',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Badge({ className, children }: SurfaceProps) {
  return <span className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', className)}>{children}</span>;
}

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">{title}</h2>
              {description ? <p className="mt-1 text-sm text-slate-300">{description}</p> : null}
            </div>
            <Button size="icon" variant="secondary" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>{children}</div>
        {footer ? <div className="border-t bg-slate-50 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <div className={cn('fixed inset-0 z-50 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-slate-900/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-2xl overflow-auto bg-white shadow-2xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  subtitle: string;
}) {
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
  const isEditor = role === 'editor' || role === 'admin';

  return (
    <Badge
      className={cn(
        'border',
        isEditor ? 'border-emerald-200 bg-emerald-100 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-700'
      )}
    >
      {isEditor ? <Shield className="mr-1 h-3.5 w-3.5" /> : <Eye className="mr-1 h-3.5 w-3.5" />}
      {role ? `${role.charAt(0).toUpperCase()}${role.slice(1)} access` : 'Demo mode'}
    </Badge>
  );
}

function UseCaseForm({
  open,
  onOpenChange,
  onSave,
  editingItem,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: UseCaseItem) => void;
  editingItem: UseCaseItem | null;
}) {
  const emptyForm: UseCaseItem = {
    id: '',
    name: '',
    department: '',
    stakeholder: '',
    status: 'Idea',
    horizon: 'Future Pipeline',
    priority: 'Medium',
    description: '',
    impact: '',
    notes: '',
    updated: new Date().toISOString().slice(0, 10),
  };

  const [form, setForm] = useState<UseCaseItem>(editingItem ?? emptyForm);

  useEffect(() => {
    setForm(editingItem ?? emptyForm);
  }, [editingItem, open]);

  const update = (key: keyof UseCaseItem, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={editingItem ? 'Edit use case' : 'Add new use case'}
      description="Keep updates lightweight while capturing enough detail for reviews, planning, and execution."
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.id || !form.name) return;
              onSave({ ...form, updated: form.updated || new Date().toISOString().slice(0, 10) });
              onOpenChange(false);
            }}
            type="button"
          >
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
          <Input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Strategy" />
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
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
          <Select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">Portfolio Horizon</label>
          <Select value={form.horizon} onChange={(e) => update('horizon', e.target.value)}>
            {horizonOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
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
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [emailInput, setEmailInput] = useState('');
  const [notice, setNotice] = useState('');

  const isEditor = userRole === 'editor' || userRole === 'admin';

  const departments = useMemo(() => ['All', ...Array.from(new Set(useCases.map((item) => item.department).filter(Boolean)))], [useCases]);

useEffect(() => {
  if (!supabase) return;

  let mounted = true;

  const loadSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (!mounted) return;

    if (error) {
      console.error("Session error:", error.message);
      setSession(null);
      return;
    }

    setSession(data.session ?? null);
  };

  void loadSession();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, currentSession) => {
    if (!mounted) return;
    setSession(currentSession ?? null);
  });

  return () => {
    mounted = false;
    subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  if (!supabase) return;

  if (!session?.user) {
    setUserRole(null);
    return;
  }

  void loadData();
}, [session]);

  async function loadData(): Promise<void> {
    if (!supabase || !session?.user) return;

    setLoading(true);
    setNotice('');

    const [{ data: roleRow, error: roleError }, { data: useCaseRows, error: useCaseError }] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('use_cases').select('*').order('updated', { ascending: false }),
    ]);

    if (roleError) {
      setNotice('Signed in, but role lookup failed. Check RLS or user_roles setup.');
    } else {
      const fetchedRole = (roleRow?.role as UserRole) ?? 'viewer';
      setUserRole(fetchedRole);
    }

    if (useCaseError) {
      setNotice('Could not load live data. Showing demo content until Supabase is fully configured.');
      setUseCases(demoUseCases);
    } else {
      const rows = (useCaseRows as UseCaseItem[] | null) ?? [];
      setUseCases(rows);
    }

    setLoading(false);
  }

  const filtered = useMemo(() => {
    return useCases.filter((item) => {
      const searchableText = `${item.id} ${item.name} ${item.department} ${item.stakeholder} ${item.description} ${item.notes}`.toLowerCase();
      const matchesSearch = searchableText.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchesDept = deptFilter === 'All' || item.department === deptFilter;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [useCases, search, statusFilter, deptFilter]);

  const stats = useMemo(
    () => ({
      total: useCases.length,
      current: useCases.filter((item) => item.horizon === 'Current Quarter').length,
      future: useCases.filter((item) => item.horizon === 'Future Pipeline').length,
      liveOrProgress: useCases.filter((item) => ['Live', 'In Progress'].includes(item.status)).length,
    }),
    [useCases]
  );

  async function saveItem(item: UseCaseItem): Promise<void> {
    setEditingItem(null);

    if (!supabase) {
      setUseCases((prev) => {
        const exists = prev.some((existing) => existing.id === item.id);
        return exists ? prev.map((existing) => (existing.id === item.id ? item : existing)) : [item, ...prev];
      });
      setNotice('Demo mode: changes are local only until Supabase is connected.');
      return;
    }

    if (!isEditor) {
      setNotice('You currently have read-only access.');
      return;
    }

    setSaving(true);

    const payload: UseCaseItem = {
      ...item,
      created_by: session?.user?.id,
    };

    const { data, error } = await supabase.from('use_cases').upsert(payload).select();

    if (error) {
      setNotice('Save failed. Check your RLS policies and table schema.');
    } else {
      await loadData();
      const savedRow = ((data as UseCaseItem[] | null) ?? [])[0] ?? null;
      if (savedRow) setActiveItem(savedRow);
      setNotice('Saved successfully.');
    }

    setSaving(false);
  }

  async function signInWithMagicLink(): Promise<void> {
    if (!supabase || !emailInput) return;

    setNotice('');

    const { error } = await supabase.auth.signInWithOtp({
      email: emailInput,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });

    if (error) {
      setNotice('Could not send sign-in link.');
    } else {
      setNotice('Magic link sent. Check your email.');
    }
  }

  async function signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserRole(null);
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl md:p-8"
        >
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
              <AccessBadge role={session?.user ? userRole : null} />

              {session?.user ? (
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <span>{session.user.email}</span>
                  <Button variant="secondary" onClick={() => void signOut()} type="button">
                    <LogOut className="h-4 w-4" /> Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  <Input
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter work email"
                    className="h-11 min-w-[220px] border-white/15 bg-white/10 text-white placeholder:text-slate-300"
                  />
                  <Button className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => void signInWithMagicLink()} type="button">
                    <LogIn className="h-4 w-4" /> Sign in
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-slate-200">
                  Add Supabase keys to enable team sign-in and persistent storage.
                </div>
              )}

              {(isEditor || !hasSupabaseEnv) ? (
                <Button
                  className="bg-white text-slate-900 hover:bg-slate-100"
                  onClick={() => {
                    setEditingItem(null);
                    setFormOpen(true);
                  }}
                  type="button"
                >
                  <Plus className="h-4 w-4" /> Add use case
                </Button>
              ) : null}
            </div>
          </div>
        </motion.div>

        {notice ? (
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-slate-600">
              <span>{notice}</span>
              {hasSupabaseEnv && session?.user ? (
                <Button variant="outline" onClick={() => void loadData()} type="button">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total use cases" value={stats.total} subtitle="Across current and future portfolio" icon={Briefcase} />
          <StatCard title="Current quarter" value={stats.current} subtitle="Active focus for review" icon={Target} />
          <StatCard title="Future pipeline" value={stats.future} subtitle="Ideas and planned initiatives" icon={Clock3} />
          <StatCard title="Moving forward" value={stats.liveOrProgress} subtitle="Live or currently in progress" icon={CalendarDays} />
        </div>

        <Card className="rounded-[28px]">
          <CardContent className="p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search use cases, stakeholder, department..."
                    className="h-11 pl-11"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 w-full pl-10 md:w-[180px]">
                    <option value="All">All statuses</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-11 w-full pl-10 md:w-[180px]">
                    {departments.map((department) => (
                      <option key={department} value={department}>
                        {department === 'All' ? 'All departments' : department}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="inline-flex rounded-2xl bg-slate-100 p-1">
                <button
                  className={cn('inline-flex items-center rounded-xl px-3 py-2 text-sm', view === 'table' ? 'bg-white shadow-sm' : 'text-slate-600')}
                  onClick={() => setView('table')}
                  type="button"
                >
                  <Table2 className="mr-2 h-4 w-4" /> Table
                </button>
                <button
                  className={cn('inline-flex items-center rounded-xl px-3 py-2 text-sm', view === 'cards' ? 'bg-white shadow-sm' : 'text-slate-600')}
                  onClick={() => setView('cards')}
                  type="button"
                >
                  <LayoutGrid className="mr-2 h-4 w-4" /> Cards
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                        <th className="px-6 py-4 font-medium text-right">Action</th>
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
                          <td className="px-6 py-4 text-sm text-slate-700">{item.department}</td>
                          <td className="px-6 py-4 text-sm text-slate-700">{item.stakeholder}</td>
                          <td className="px-6 py-4">
                            <Badge className={cn('border', statusStyles[item.status])}>{item.status}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={cn('border', priorityStyles[item.priority])}>{item.priority}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">{item.horizon}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{item.updated}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setActiveItem(item)} type="button">
                                View
                              </Button>
                              {isEditor ? (
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setFormOpen(true);
                                  }}
                                  type="button"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {loading ? <div className="p-8 text-center text-slate-500">Loading data...</div> : null}
                {!loading && filtered.length === 0 ? <div className="p-12 text-center text-slate-500">No use cases match the current filters.</div> : null}
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            >
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
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> {item.department}
                      </div>
                      <div className="flex items-center gap-2">
                        <User2 className="h-4 w-4" /> {item.stakeholder}
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> {item.horizon}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" onClick={() => setActiveItem(item)} type="button">
                        Open details
                      </Button>
                      {isEditor ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingItem(item);
                            setFormOpen(true);
                          }}
                          type="button"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <UseCaseForm open={formOpen} onOpenChange={setFormOpen} onSave={(item) => void saveItem(item)} editingItem={editingItem} />

        <Drawer open={Boolean(activeItem)} onClose={() => setActiveItem(null)}>
          {activeItem ? (
            <>
              <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm text-slate-300">{activeItem.id}</div>
                    <h2 className="mt-1 text-2xl font-semibold text-white">{activeItem.name}</h2>
                    <p className="mt-1 text-sm text-slate-300">Detailed portfolio view for planning, review, and execution.</p>
                  </div>
                  <Button size="icon" variant="secondary" onClick={() => setActiveItem(null)} type="button">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn('border border-white/20 bg-white/10 text-white', statusStyles[activeItem.status])}>{activeItem.status}</Badge>
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
                </div>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-slate-700">{activeItem.description}</p>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Expected impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-slate-700">{activeItem.impact}</p>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 shadow-none">
                  <CardHeader>
                    <CardTitle>Notes and execution context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="leading-7 text-slate-700">{activeItem.notes}</p>
                  </CardContent>
                </Card>

                {isEditor ? (
                  <div className="flex gap-3">
                    <Button
                      disabled={saving}
                      onClick={() => {
                        setEditingItem(activeItem);
                        setFormOpen(true);
                      }}
                      type="button"
                    >
                      <Pencil className="h-4 w-4" /> Edit use case
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </Drawer>
      </div>
    </div>
  );
}
