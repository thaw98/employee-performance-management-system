import { cleanup, render, screen, waitFor } from '@testing-library/react';
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
    cycleId: 1,
    cycleName: 'Q1 2026',
    cycleStartDate: '2026-01-01',
    cycleEndDate: '2026-03-31',
    departmentId: 10,
    departmentName: 'Engineering',
    positionId: 20,
    positionName: 'Developer',
    totalCount: 2,
    hrApprovedCount: 1,
    finalizedCount: 1,
    averageScore: 86.5,
  },
  {
    cycleId: 2,
    cycleName: 'Q2 2026',
    cycleStartDate: '2026-04-01',
    cycleEndDate: '2026-06-30',
    departmentId: 11,
    departmentName: 'Finance',
    positionId: 21,
    positionName: 'Analyst',
    totalCount: 1,
    hrApprovedCount: 1,
    finalizedCount: 0,
    averageScore: 74,
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('AppraisalHistoryPage', () => {
  it('renders grouped history rows', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });

    render(<AppraisalHistoryPage mode="hr" />);

    expect(await screen.findByRole('heading', { name: 'Engineering' })).toBeTruthy();
    expect(screen.getAllByText('Developer').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Finance' })).toBeTruthy();
    expect(screen.getByText('86.5%')).toBeTruthy();
  });

  it('filters rows by department, position, status, and search', async () => {
    axiosGetMock.mockResolvedValueOnce({ data: { data: historyRows } });
    render(<AppraisalHistoryPage mode="hr" />);

    await screen.findByRole('heading', { name: 'Engineering' });
    await userEvent.selectOptions(screen.getByLabelText('Department'), 'Finance');
    expect(screen.queryByRole('heading', { name: 'Engineering' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Finance' })).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Position'), 'Developer');
    expect(screen.getByText('No History Found')).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Position'), 'ALL');
    await userEvent.selectOptions(screen.getByLabelText('Status'), 'Finalized');
    expect(screen.getByText('No History Found')).toBeTruthy();

    await userEvent.selectOptions(screen.getByLabelText('Department'), 'ALL');
    expect(screen.getByRole('heading', { name: 'Engineering' })).toBeTruthy();

    await userEvent.type(screen.getByPlaceholderText('Search history...'), 'finance');
    expect(screen.getByText('No History Found')).toBeTruthy();
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
    await screen.findByRole('heading', { name: 'Engineering' });
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
