import React, { useEffect, useMemo, useState } from 'react';
import axios from '../../app/axiosInstance';
import { toast } from 'react-hot-toast';
import { Award, Briefcase, Building2, Calendar, ChevronDown, Download, FileSpreadsheet, Filter, History, LayoutGrid, List, Search, User } from 'lucide-react';
import { downloadBlobFile } from '../../utils/downloadBlobFile';
import {
  appraisalGradientBtn,
  appraisalGradientIcon,
  appraisalGradientSoft,
} from '../../features/appraisals/appraisalTheme';

interface AppraisalHistoryRow {
  assignmentId: number;
  cycleId: number;
  cycleName: string;
  cycleStartDate?: string | null;
  cycleEndDate?: string | null;
  employeeName?: string | null;
  employeeId?: string | null;
  staffNo?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
  status?: string | null;
  statusLabel?: string | null;
  score?: number | null;
}

type RoleMode = 'hr' | 'manager' | 'employee';
type ViewMode = 'table' | 'grid';

interface AppraisalHistoryPageProps {
  mode: RoleMode;
}

const ALL = 'ALL';
const VIEW_MODE_STORAGE_KEY = 'appraisalHistoryViewMode';

function getInitialViewMode(): ViewMode {
  if (typeof window === 'undefined') return 'table';
  return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === 'grid' ? 'grid' : 'table';
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatDateRange(row: AppraisalHistoryRow) {
  return `${formatDate(row.cycleStartDate)} - ${formatDate(row.cycleEndDate)}`;
}

function formatPercent(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

function staffNo(row: AppraisalHistoryRow) {
  return row.staffNo || row.employeeId || 'N/A';
}

function employeeName(row: AppraisalHistoryRow) {
  return row.employeeName || 'Unnamed Employee';
}

function statusLabel(row: AppraisalHistoryRow) {
  return row.statusLabel || (row.status === 'LOCKED' ? 'Finalized' : row.status === 'HR_APPROVED' ? 'HR Approved' : 'N/A');
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
  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
  }, [viewMode]);

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
    const searchValues = [
      row.cycleName,
      row.departmentName,
      row.positionName,
      row.employeeName,
      row.staffNo,
      row.employeeId,
    ];
    const matchesSearch = !term || searchValues.some((value) => (value ?? '').toLowerCase().includes(term));
    const matchesCycle = cycleFilter === ALL || String(row.cycleId) === cycleFilter;
    const matchesDepartment = departmentFilter === ALL || row.departmentName === departmentFilter;
    const matchesPosition = positionFilter === ALL || row.positionName === positionFilter;
    const matchesStatus = statusFilter === ALL || row.status === statusFilter;
    return matchesSearch && matchesCycle && matchesDepartment && matchesPosition && matchesStatus;
  });

  const totals = filteredRows.reduce(
    (acc, row) => ({
      total: acc.total + 1,
      approved: acc.approved + (row.status === 'HR_APPROVED' ? 1 : 0),
      finalized: acc.finalized + (row.status === 'LOCKED' ? 1 : 0),
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200" aria-label="History view mode">
            <ViewModeButton active={viewMode === 'table'} label="Table" onClick={() => setViewMode('table')}>
              <List size={15} />
            </ViewModeButton>
            <ViewModeButton active={viewMode === 'grid'} label="Grid" onClick={() => setViewMode('grid')}>
              <LayoutGrid size={15} />
            </ViewModeButton>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Completed" value={totals.total} icon={<Award size={18} className="text-[#2463eb]" />} tone="text-slate-900" />
        <StatCard label="HR Approved" value={totals.approved} icon={<Filter size={18} className="text-emerald-600" />} tone="text-emerald-600" />
        <StatCard label="Finalized" value={totals.finalized} icon={<Download size={18} className="text-slate-800" />} tone="text-slate-900" />
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
      ) : viewMode === 'table' ? (
        <HistoryTable rows={filteredRows} />
      ) : (
        <HistoryGrid rows={filteredRows} />
      )}
    </div>
  );
}

function ViewModeButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${label} view`}
      title={`${label} view`}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-[#2463eb] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
    >
      {children}
      {label}
    </button>
  );
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: React.ReactNode; tone: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-black mt-3 ${tone}`}>{value}</p>
    </div>
  );
}

function HistoryTable({ rows }: { rows: AppraisalHistoryRow[] }) {
  return (
    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              {['Employee Name', 'Staff No', 'Position', 'Department', 'Cycle', 'Status', 'Score', 'Date Range'].map((heading) => (
                <th key={heading} scope="col" className="px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.assignmentId} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-5 py-4 text-sm font-black text-slate-900 whitespace-nowrap">{employeeName(row)}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-600 whitespace-nowrap">{staffNo(row)}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">{row.positionName || 'Unassigned Position'}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-600 whitespace-nowrap">{row.departmentName || 'Unassigned Department'}</td>
                <td className="px-5 py-4 text-sm font-bold text-slate-900 whitespace-nowrap">{row.cycleName}</td>
                <td className="px-5 py-4 whitespace-nowrap"><StatusPill row={row} /></td>
                <td className="px-5 py-4 text-sm font-black text-slate-900 whitespace-nowrap">{formatPercent(row.score)}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-500 whitespace-nowrap">{formatDateRange(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryGrid({ rows }: { rows: AppraisalHistoryRow[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {rows.map((row) => (
        <article key={row.assignmentId} className="bg-white rounded-[32px] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-[#2463eb]/5 transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-black text-[#2463eb] uppercase tracking-widest flex items-center gap-2">
                <User size={13} /> {staffNo(row)}
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-900 break-words">{employeeName(row)}</h3>
              <p className="mt-1 text-sm font-bold text-slate-500 flex items-center gap-2">
                <Briefcase size={15} /> {row.positionName || 'Unassigned Position'}
              </p>
            </div>
            <div className={`${appraisalGradientSoft} rounded-2xl px-4 py-3 text-right min-w-24`}>
              <p className="text-[9px] font-black text-[#2463eb] uppercase tracking-widest">Score</p>
              <p className="text-xl font-black text-slate-900">{formatPercent(row.score)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            <DetailItem icon={<Building2 size={14} />} label="Department" value={row.departmentName || 'Unassigned Department'} />
            <DetailItem icon={<Calendar size={14} />} label="Cycle" value={row.cycleName} />
            <DetailItem label="Status" value={statusLabel(row)} />
            <DetailItem label="Date Range" value={formatDateRange(row)} />
          </div>
        </article>
      ))}
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 min-w-0">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-800 break-words">{value}</p>
    </div>
  );
}

function StatusPill({ row }: { row: AppraisalHistoryRow }) {
  const finalized = row.status === 'LOCKED';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${finalized ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
      {statusLabel(row)}
    </span>
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
