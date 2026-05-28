import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CombinedFeedbackHistoryPage } from './CombinedFeedbackHistoryPage';

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
      ],
      totalElements: 2,
      totalPages: 1,
    },
  },
};

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
      return Promise.resolve(pageResponse);
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('does not show future review cycles in the cycle filter', async () => {
    render(<CombinedFeedbackHistoryPage />);

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith('/review-cycles?requiresEmployeeSubmission=true');
    });

    const cycleFilter = screen.getByLabelText('Review cycle') as HTMLSelectElement;
    const optionLabels = Array.from(cycleFilter.options).map((option) => option.text);
    expect(optionLabels).toContain('2026 H1');
    expect(optionLabels).not.toContain('Q2 2026-2027');
  });

  it('renders tabs, filters, rows, and masks anonymous received evaluator details', async () => {
    render(<CombinedFeedbackHistoryPage />);

    expect(screen.getByRole('tab', { name: 'All' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Given' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Received' })).toBeTruthy();
    expect(screen.getByLabelText('Search people')).toBeTruthy();

    expect(await screen.findByText('Aye Aye')).toBeTruthy();
    expect(screen.getAllByText('Anonymous').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Given').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Received').length).toBeGreaterThan(0);
  });

  it('sends direction when a direction tab is selected', async () => {
    const user = userEvent.setup();
    render(<CombinedFeedbackHistoryPage />);

    await screen.findByText('Aye Aye');
    await user.click(screen.getByRole('tab', { name: 'Received' }));

    await waitFor(() => {
      expect(mocks.get).toHaveBeenCalledWith(expect.stringContaining('/feedback/combined-history?page=0&size=10&direction=RECEIVED'));
    });
  });

  it('opens details modal and offers PDF export for rows', async () => {
    const user = userEvent.setup();
    render(<CombinedFeedbackHistoryPage />);

    await screen.findByText('Aye Aye');
    await user.click(screen.getAllByTitle('View details')[0]);

    expect(await screen.findByText('Feedback Details')).toBeTruthy();
    expect(await screen.findByText('Communication')).toBeTruthy();
    expect(screen.getByRole('button', { name: /PRINT REPORT/i })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /PRINT REPORT/i }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
  });
});
