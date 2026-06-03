import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CombinedFeedbackHistoryPage } from './CombinedFeedbackHistoryPage';
import { FeedbackDetailPage } from './FeedbackDetailPage';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  save: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('../app/axiosInstance', () => ({
  default: {
    get: mocks.get,
  },
}));

vi.mock('../features/user/userApi', () => ({
  useGetProfileQuery: () => ({ data: { data: { timeFormat: '12h' } } }),
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(function () {
    return {
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    text: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    roundedRect: vi.fn(),
    internal: {
      pageSize: {
        getWidth: vi.fn(() => 210),
        getHeight: vi.fn(() => 297),
      },
    },
    getNumberOfPages: vi.fn(() => 1),
    setPage: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    save: mocks.save,
    };
  }),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc: any) => {
    doc.lastAutoTable = { finalY: 100 };
  }),
}));

vi.mock('../utils/feedbackScorePdf', () => ({
  addFeedbackScorePerformanceSection: vi.fn(() => 150),
}));

const selfFeedbackRow = {
  id: 3,
  date: '2026-05-15T10:00:00Z',
  direction: 'GIVEN',
  evaluatorName: 'Current User',
  evaluatorStaffNo: 'E001',
  evaluatorPosition: 'Engineer',
  evaluatorDepartment: 'Product',
  evaluateeName: 'Current User',
  evaluateeStaffNo: 'E001',
  evaluateePosition: 'Engineer',
  evaluateeDepartment: 'Product',
  role: 'SELF',
  score: 75,
  remark: 'Meet Requirement',
  reviewCycleName: '2026 H1',
};

const pageResponse = {
  data: {
    data: {
      content: [
        {
          id: 1,
          date: '2026-05-01T10:00:00Z',
          direction: 'GIVEN',
          evaluatorName: 'Current User',
          evaluatorStaffNo: 'E001',
          evaluatorPosition: 'Engineer',
          evaluatorDepartment: 'Product',
          evaluateeName: 'Aye Aye',
          evaluateeStaffNo: 'E002',
          evaluateePosition: 'Analyst',
          evaluateeDepartment: 'Product',
          role: 'PEER',
          score: 82,
          remark: 'Good',
          anonymous: true,
          reviewCycleName: '2026 H1',
          additionalComments: 'Great teamwork',
        },
        {
          id: 2,
          date: '2026-05-02T10:00:00Z',
          direction: 'RECEIVED',
          evaluatorName: 'Anonymous',
          evaluatorPosition: null,
          evaluatorDepartment: null,
          evaluateeName: 'Current User',
          evaluateeStaffNo: 'E001',
          evaluateePosition: 'Engineer',
          evaluateeDepartment: 'Product',
          role: 'MANAGER',
          score: 90,
          remark: 'Outstanding',
          anonymous: true,
          reviewCycleName: '2026 H1',
        },
        selfFeedbackRow,
      ],
      totalElements: 3,
      totalPages: 1,
    },
  },
};

const detailPageResponse = {
  data: {
    data: {
      ...pageResponse.data.data.content[0],
      details: [{ criteriaName: 'Communication', rating: 5, comment: 'Clear and kind' }],
    },
  },
};

let currentLocation: ReturnType<typeof useLocation> | null = null;

function LocationProbe() {
  currentLocation = useLocation();
  return null;
}

function renderHistoryRoute(initialEntries = ['/hr/360-feedback/history']) {
  return render(
    <MemoryRouter initialEntries={initialEntries as any}>
      <LocationProbe />
      <Routes>
        <Route path="/hr/360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
        <Route path="/hr/360-feedback/history/:feedbackId" element={<FeedbackDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CombinedFeedbackHistoryPage', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.save.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.get.mockImplementation((url: string) => {
      if (url.startsWith('/review-cycles')) {
        return Promise.resolve({
          data: {
            data: [
              { id: 10, name: '2026 H1', startDate: '2026-01-01', status: 'ACTIVE' },
              { id: 11, name: 'Q2 2026-2027', startDate: '2026-07-01', status: 'UPCOMING' },
            ],
          },
        });
      }
      if (url.includes('/details')) {
        return Promise.resolve({ data: { data: [{ criteriaName: 'Communication', rating: 5, comment: 'Clear' }] } });
      }
      if (url.includes('/detail-page')) {
        return Promise.resolve(detailPageResponse);
      }
      return Promise.resolve(pageResponse);
    });
    currentLocation = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('does not show future review cycles in the cycle filter', async () => {
    renderHistoryRoute();

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/review-cycles?requiresEmployeeSubmission=true');
    });

    const cycleFilter = screen.getByLabelText('Review cycle') as HTMLSelectElement;
    const optionLabels = Array.from(cycleFilter.options).map((option) => option.text);
    expect(optionLabels).toContain('2026 H1');
    expect(optionLabels).not.toContain('Q2 2026-2027');
  });

  it('renders tabs, filters, rows, and masks anonymous received evaluator details', async () => {
    renderHistoryRoute();

    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Given' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Received' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Self' })).toBeTruthy();
    expect(screen.getByLabelText('Search people')).toBeTruthy();

    expect(await screen.findByText('Aye Aye')).toBeTruthy();
    expect(screen.getAllByText('Anonymous').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Given').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Received').length).toBeGreaterThan(0);
  });

  it('masks role as dash for anonymous received feedback while showing role for given feedback', async () => {
    renderHistoryRoute();

    await screen.findByText('Aye Aye');
    const peerRoleCells = screen.getAllByText('PEER');
    expect(peerRoleCells.length).toBeGreaterThan(0);
    expect(screen.queryByText('MANAGER')).toBeNull();
    const dashCells = screen.getAllByText('-');
    expect(dashCells.length).toBeGreaterThan(0);
  });

  it('sends direction when a direction tab is selected', async () => {
    const user = userEvent.setup();
    renderHistoryRoute();

    await screen.findByText('Aye Aye');
    await user.click(screen.getByRole('tab', { name: 'Received' }));

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining('/feedback/combined-history?page=0&size=10&direction=RECEIVED'));
    });
  });

  it('sends feedbackType=SELF when Self tab is selected', async () => {
    const user = userEvent.setup();
    renderHistoryRoute();

    await screen.findByText('Aye Aye');
    mocks.get.mockClear();
    await user.click(screen.getByRole('tab', { name: 'Self' }));

    await waitFor(() => {
      const calls = mocks.get.mock.calls.filter(([url]: string[]) => url.includes('/feedback/combined-history'));
      expect(calls.length).toBeGreaterThan(0);
      const url = calls[calls.length - 1][0] as string;
      expect(url).toContain('feedbackType=SELF');
      expect(url).not.toContain('direction=');
    });
  });

  it('renders Self badge for self-feedback rows', async () => {
    renderHistoryRoute();

    expect(await screen.findByText('Self')).toBeTruthy();
  });

  it('shows employee name without duplicated evaluator/evaluatee labels for self rows', async () => {
    renderHistoryRoute();

    await screen.findByText('Self');
    const selfBadges = screen.getAllByText('Self');
    expect(selfBadges.length).toBeGreaterThanOrEqual(2);
    const selfNameElements = screen.getAllByText('Current User');
    expect(selfNameElements.length).toBeGreaterThanOrEqual(3);
  });

  it('navigates to a details page from row view action', async () => {
    const user = userEvent.setup();
    renderHistoryRoute();

    await screen.findByText('Aye Aye');
    await user.click(screen.getAllByTitle('View details')[0]);

    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/hr/360-feedback/history/1');
    });
    expect(await screen.findByText('Feedback Details')).toBeTruthy();
    expect(await screen.findByText('Communication')).toBeTruthy();
  });

  it('renders criteria, comments, score, and PDF export on the detail route', async () => {
    const user = userEvent.setup();
    renderHistoryRoute(['/hr/360-feedback/history/1']);

    expect(await screen.findByText('Communication')).toBeTruthy();
    expect(screen.getByText('Clear and kind')).toBeTruthy();
    expect(screen.getByText('Good')).toBeTruthy();
    const pdfButtons = screen.getAllByRole('button', { name: /PDF/i });
    expect(pdfButtons.length).toBeGreaterThan(0);

    await user.click(pdfButtons[0]);
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  });

  it('back returns to the previous list route with state', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={[{
        pathname: '/hr/360-feedback/history/1',
        state: {
          sourcePath: '/hr/360-feedback/history',
          listState: { page: 2, pageSize: 20, filters: { direction: 'RECEIVED' } },
        },
      } as any]}>
        <LocationProbe />
        <Routes>
          <Route path="/hr/360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
          <Route path="/hr/360-feedback/history/:feedbackId" element={<FeedbackDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Communication');
    const backButtons = screen.getAllByRole('button');
    const backButton = backButtons.find(b => b.querySelector('.lucide-arrow-left'));
    expect(backButton).toBeTruthy();
    await user.click(backButton!);

    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/hr/360-feedback/history');
      expect(currentLocation?.state).toEqual({ page: 2, pageSize: 20, filters: { direction: 'RECEIVED' } });
    });
  });
});
