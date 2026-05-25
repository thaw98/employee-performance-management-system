import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppraisalHistoryPage } from './AppraisalHistoryPage';

const axiosGetMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const downloadBlobFileMock = vi.hoisted(() => vi.fn());

vi.mock('../../app/axiosInstance', () => ({
  default: { get: (...args: unknown[]) => axiosGetMock(...args) },
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../../utils/downloadBlobFile', () => ({
  downloadBlobFile: (...args: unknown[]) => downloadBlobFileMock(...args),
}));

const historyRows = [
  {
    assignmentId: 1001,
    cycleId: 1,
    cycleName: 'Q1 2026',
    cycleStartDate: '2026-01-01',
    cycleEndDate: '2026-03-31',
    employeeName: 'Aye Aye',
    employeeId: 'EMP-100',
    staffNo: 'EMP-100',
    departmentName: 'Engineering',
    positionName: 'Developer',
    status: 'LOCKED',
    statusLabel: 'Finalized',
    score: 86.5,
  },
  {
    assignmentId: 1002,
    cycleId: 2,
    cycleName: 'Q2 2026',
    cycleStartDate: '2026-04-01',
    cycleEndDate: '2026-06-30',
    employeeName: 'Mya Mya',
    employeeId: 'EMP-200',
    staffNo: 'EMP-200',
    departmentName: 'Finance',
    positionName: 'Analyst',
    status: 'HR_APPROVED',
    statusLabel: 'HR Approved',
    score: 74,
  },
];

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

describe('AppraisalHistoryPage', () => {
  it('defaults to table view and renders employee detail columns', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });

    render(<AppraisalHistoryPage mode="hr" />);

    expect(await screen.findByRole('button', { name: 'Table view' })).toHaveAttribute('aria-pressed', 'true');
    const table = screen.getByRole('table');
    ['Employee Name', 'Staff No', 'Position', 'Department', 'Cycle', 'Status', 'Score', 'Date Range'].forEach((heading) => {
      expect(within(table).getByRole('columnheader', { name: heading })).toBeTruthy();
    });
    expect(within(table).getByText('Aye Aye')).toBeTruthy();
    expect(within(table).getByText('EMP-100')).toBeTruthy();
    expect(within(table).getByText('Engineering')).toBeTruthy();
    expect(within(table).getByText('Developer')).toBeTruthy();
    expect(within(table).getByText('Q1 2026')).toBeTruthy();
    expect(within(table).getByText('86.5%')).toBeTruthy();
  });

  it('switches between table and grid and restores the saved view', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });
    render(<AppraisalHistoryPage mode="hr" />);

    await screen.findByRole('table');
    await userEvent.click(screen.getByRole('button', { name: 'Grid view' }));

    expect(screen.queryByRole('table')).toBeNull();
    expect(localStorage.getItem('appraisalHistoryViewMode')).toBe('grid');
    expect(screen.getByRole('heading', { name: 'Aye Aye' })).toBeTruthy();
    cleanup();

    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });
    render(<AppraisalHistoryPage mode="hr" />);

    expect(await screen.findByRole('button', { name: 'Grid view' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('filters rows by department, position, status, employee search, and staff no search', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });
    render(<AppraisalHistoryPage mode="hr" />);

    await screen.findByText('Aye Aye');
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Finance');
    expect(screen.queryByText('Aye Aye')).toBeNull();
    expect(screen.getByText('Mya Mya')).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Position'), 'Developer');
    expect(screen.getByText('No History Found')).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Position'), 'ALL');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Finalized');
    expect(screen.getByText('No History Found')).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Department'), 'ALL');
    expect(screen.getByText('Aye Aye')).toBeTruthy();

    await userEvent.clear(screen.getByPlaceholderText('Search history...'));
    await userEvent.type(screen.getByPlaceholderText('Search history...'), 'EMP-100');
    expect(screen.getByText('Aye Aye')).toBeTruthy();
    expect(screen.queryByText('Mya Mya')).toBeNull();

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'ALL');
    await userEvent.clear(screen.getByPlaceholderText('Search history...'));
    await userEvent.type(screen.getByPlaceholderText('Search history...'), 'mya');
    expect(screen.getByText('Mya Mya')).toBeTruthy();
    expect(screen.queryByText('Aye Aye')).toBeNull();
  });

  it('recalculates top stats from filtered employee rows', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });
    render(<AppraisalHistoryPage mode="hr" />);

    await screen.findByText('Aye Aye');
    expect(screen.getByText('Completed').closest('.bg-white')?.textContent).toContain('2');
    expect(screen.getAllByText('HR Approved')[0].closest('.bg-white')?.textContent).toContain('1');
    expect(screen.getAllByText('Finalized')[0].closest('.bg-white')?.textContent).toContain('1');

    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Finalized');
    expect(screen.getByText('Completed').closest('.bg-white')?.textContent).toContain('1');
    expect(screen.getAllByText('HR Approved')[0].closest('.bg-white')?.textContent).toContain('0');
    expect(screen.getAllByText('Finalized')[0].closest('.bg-white')?.textContent).toContain('1');
  });

  it('exports the selected cycle as an Excel blob', async () => {
    const blob = new Blob(['xlsx']);
    axiosGetMock
      .mockResolvedValueOnce({ data: { data: historyRows } })
      .mockResolvedValueOnce({
        data: blob,
        headers: { 'content-disposition': 'attachment; filename="appraisal-history-q2.xlsx"' },
      });

    render(<AppraisalHistoryPage mode="manager" />);
    await screen.findByText('Aye Aye');
    await userEvent.selectOptions(screen.getByLabelText('Cycle'), '2');
    await userEvent.click(screen.getByRole('button', { name: /export cycle/i }));

    await waitFor(() => {
      expect(axiosGetMock).toHaveBeenLastCalledWith('/appraisal-assignments/history/export/excel', {
        params: { cycleId: '2' },
        responseType: 'blob',
      });
    });
    expect(downloadBlobFileMock).toHaveBeenCalledWith(blob, 'appraisal-history-q2.xlsx');
    expect(toastSuccessMock).toHaveBeenCalledWith('Appraisal history exported successfully');
  });

  it('renders empty state cleanly', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: [] } });
    render(<AppraisalHistoryPage mode="employee" />);
    expect(await screen.findByText('No History Found')).toBeTruthy();
  });

  it('renders error state cleanly', async () => {
    axiosGetMock.mockRejectedValueOnce(new Error('network'));
    render(<AppraisalHistoryPage mode="employee" />);
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to load appraisal history');
    });
  });
});
