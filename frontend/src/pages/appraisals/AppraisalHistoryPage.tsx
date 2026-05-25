import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Award, Building2, Calendar, ChevronDown, Download, FileSpreadsheet, Filter, History, Search } from 'lucide-react';
import { downloadBlobFile } from '../../utils/downloadBlobFile';
import {
  appraisalGradientBtn,
  appraisalGradientIcon,
  appraisalGradientSoft,
} from '../../features/appraisals/appraisalTheme';

interface AppraisalHistoryRow {
  cycleId: number;
  cycleName: string;
  cycleStartDate?: string | null;
  cycleEndDate?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  positionId?: number | null;
  positionName?: string | null;
  totalCount: number;
  hrApprovedCount: number;
  finalizedCount: number;
  averageScore?: number | null;
}

type RoleMode = 'hr' | 'manager' | 'employee';

interface AppraisalHistoryPageProps {
  mode: RoleMode;
}

const ALL = 'ALL';

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function selectedCycleName(rows: AppraisalHistoryRow[], cycleId: string) {
  return rows.find((row) => String(row.cycleId) === cycleId)?.cycleName ?? 'selected-cycle';
}

function parseFilename(contentDisposition?: string) {
  if (!contentDisposition) return null;
  const match = /filename="?([^"]+)"?/i.exec(contentDisposition);
  return match?.[1] ?? null;
}

function safeFilenamePart(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cycle';
}

export function AppraisalHistoryPage({ mode }: AppraisalHistoryPageProps) {
  const [rows, setRows] = useState<AppraisalHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState(ALL);
  const [departmentFilter, setDepartmentFilter] = useState(ALL);
  const [positionFilter, setPositionFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);

  useEffect(() => {
    let active = true;
    async function loadHistory() {
      try {
        setLoading(true);
        const response = await axios.get('/appraisal-assignments/history');
        if (!active) return;
        setRows(response.data.data ?? []);
      } catch (error) {
        if (active) {
          toast.error('Failed to load appraisal history');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadHistory();
    return () => {
      active = false;
    };
  }, []);

  const cycles = useMemo(
    () => Array.from(new Map(rows.map((row) => [row.cycleId, row.cycleName])).entries()),
    [rows],
  );
  const departments = useMemo(
    () => Array.from(new Set(rows.map((row) => row.departmentName).filter(Boolean))) as string[],
    [rows],
  );
  const positions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.positionName).filter(Boolean))) as string[],
    [rows],
  );

  useEffect(() => {
    if (cycleFilter === ALL && cycles.length === 1) {
      setCycleFilter(String(cycles[0][0]));
    }
  }, [cycleFilter, cycles]);

  const filteredRows = rows.filter((row) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term
      || row.cycleName.toLowerCase().includes(term)
      || (row.departmentName ?? '').toLowerCase().includes(term)
      || (row.positionName ?? '').toLowerCase().includes(term);
    const matchesCycle = cycleFilter === ALL || String(row.cycleId) === cycleFilter;
    const matchesDepartment = departmentFilter === ALL || row.departmentName === departmentFilter;
    const matchesPosition = positionFilter === ALL || row.positionName === positionFilter;
    const matchesStatus = statusFilter === ALL
      || (statusFilter === 'HR_APPROVED' && row.hrApprovedCount > 0)
      || (statusFilter === 'LOCKED' && row.finalizedCount > 0);
    return matchesSearch && matchesCycle && matchesDepartment && matchesPosition && matchesStatus;
  });

  const totals = filteredRows.reduce(
    (acc, row) => ({
      total: acc.total + row.totalCount,
      approved: acc.approved + row.hrApprovedCount,
      finalized: acc.finalized + row.finalizedCount,
    }),
    { total: 0, approved: 0, finalized: 0 },
  );

  const canExport = cycleFilter !== ALL;

  const handleExport = async () => {
    if (!canExport) {
      toast.error('Select a cycle to export');
      return;
    }
    try {
      setExporting(true);
      const response = await axios.get('/appraisal-assignments/history/export/excel', {
        params: { cycleId: cycleFilter },
        responseType: 'blob',
      });
      const filename = parseFilename(response.headers['content-disposition'])
        ?? `appraisal-history-${safeFilenamePart(selectedCycleName(rows, cycleFilter))}.xlsx`;
      downloadBlobFile(response.data, filename);
      toast.success('Appraisal history exported successfully');
    } catch (error) {
      toast.error('Failed to export appraisal history');
    } finally {
      setExporting(false);
    }
  };

  const title = mode === 'employee' ? 'My Appraisal History' : mode === 'manager' ? 'Team Appraisal History' : 'Appraisal History';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 ${appraisalGradientIcon} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#2463eb]/20`}>
              <History size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">{title}</h1>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">
                Past approved and finalized appraisal cycles
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canExport || exporting}
          className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${canExport ? `${appraisalGradientBtn} text-white shadow-[#2463eb]/20` : 'bg-slate-100 text-slate-400'}`}
        >
          <FileSpreadsheet size={17} />
          {exporting ? 'Exporting...' : 'Export Cycle'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</span>
            <Award size={18} className="text-[#2463eb]" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{totals.total}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HR Approved</span>
            <Filter size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">{totals.approved}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Finalized</span>
            <Download size={18} className="text-slate-800" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{totals.finalized}</p>
        </div>
      </div>

      <section className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
          <div className="relative xl:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search history..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#2463eb]/20"
            />
          </div>
          <SelectFilter value={cycleFilter} onChange={setCycleFilter} label="Cycle">
            <option value={ALL}>All Cycles</option>
            {cycles.map(([cycleId, cycleName]) => (
              <option key={cycleId} value={cycleId}>{cycleName}</option>
            ))}
          </SelectFilter>
          <SelectFilter value={departmentFilter} onChange={setDepartmentFilter} label="Department">
            <option value={ALL}>All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </SelectFilter>
          <SelectFilter value={positionFilter} onChange={setPositionFilter} label="Position">
            <option value={ALL}>All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>{position}</option>
            ))}
          </SelectFilter>
          <SelectFilter value={statusFilter} onChange={setStatusFilter} label="Status">
            <option value={ALL}>All Statuses</option>
            <option value="HR_APPROVED">HR Approved</option>
            <option value="LOCKED">Finalized</option>
          </SelectFilter>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 bg-white rounded-[32px] border border-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 p-16 text-center">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300">
            <History size={38} />
          </div>
          <h3 className="mt-5 text-xl font-black text-slate-800">No History Found</h3>
          <p className="mt-2 text-sm font-semibold text-slate-400">Approved and finalized appraisal records will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredRows.map((row) => (
            <article key={`${row.cycleId}-${row.departmentId ?? 'none'}-${row.positionId ?? 'none'}`} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#2463eb]/5 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-[#2463eb] uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={13} /> {row.cycleName}
                  </p>
                  <h3 className="mt-2 text-xl font-black text-slate-900">{row.departmentName || 'Unassigned Department'}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500 flex items-center gap-2">
                    <Building2 size={15} /> {row.positionName || 'Unassigned Position'}
                  </p>
                </div>
                <div className={`${appraisalGradientSoft} rounded-2xl px-4 py-3 text-right min-w-24`}>
                  <p className="text-[9px] font-black text-[#2463eb] uppercase tracking-widest">Average</p>
                  <p className="text-xl font-black text-slate-900">{formatPercent(row.averageScore)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                <Metric label="Total" value={row.totalCount} tone="text-slate-900" />
                <Metric label="Approved" value={row.hrApprovedCount} tone="text-emerald-600" />
                <Metric label="Finalized" value={row.finalizedCount} tone="text-slate-900" />
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>{formatDate(row.cycleStartDate)}</span>
                <span>-</span>
                <span>{formatDate(row.cycleEndDate)}</span>
                {row.finalizedCount > 0 && <span className="ml-auto px-3 py-1 rounded-full bg-slate-900 text-white">Finalized</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function SelectFilter({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 pr-10 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-600 uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-[#2463eb]/20"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`mt-1 text-2xl font-black ${tone}`}>{value}</p>
    </div>
  );
}
