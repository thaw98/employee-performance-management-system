import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { GetFeedbackPage } from './GetFeedbackPage';
import { FeedbackDetailPage } from './FeedbackDetailPage';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
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
  default: vi.fn().mockImplementation(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    setFillColor: vi.fn(),
    setDrawColor: vi.fn(),
    text: vi.fn(),
    rect: vi.fn(),
    line: vi.fn(),
    roundedRect: vi.fn(),
    internal: { pageSize: { getWidth: vi.fn(() => 210), getHeight: vi.fn(() => 297) } },
    getNumberOfPages: vi.fn(() => 1),
    setPage: vi.fn(),
    splitTextToSize: vi.fn((text: string) => [text]),
    save: vi.fn(),
  })),
}));

vi.mock('jspdf-autotable', () => ({
  default: vi.fn((doc: any) => {
    doc.lastAutoTable = { finalY: 100 };
  }),
}));

vi.mock('../utils/feedbackScorePdf', () => ({
  addFeedbackScorePerformanceSection: vi.fn(() => 150),
}));

const receivedResponse = {
  data: {
    data: {
      content: [{
        id: 7,
        date: '2026-05-01T10:00:00Z',
        evaluatorName: 'Anonymous',
        evaluatorPosition: null,
        evaluatorDepartment: null,
        evaluateeName: 'Current User',
        evaluateeStaffNo: 'E001',
        evaluateePosition: 'Engineer',
        evaluateeDepartment: 'Product',
        role: 'PEER',
        score: 86,
        remark: 'Outstanding',
        anonymous: true,
        additionalComments: 'Keep it up',
      }],
      totalPages: 1,
    },
  },
};

const detailResponse = {
  data: {
    data: {
      ...receivedResponse.data.data.content[0],
      direction: 'RECEIVED',
      details: [{ criteriaName: 'Teamwork', rating: 5, comment: 'Collaborative' }],
    },
  },
};

let currentLocation: ReturnType<typeof useLocation> | null = null;

function LocationProbe() {
  currentLocation = useLocation();
  return null;
}

describe('GetFeedbackPage', () => {
  beforeEach(() => {
    mocks.get.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.get.mockImplementation((url: string) => {
      if (url.includes('/detail-page')) {
        return Promise.resolve(detailResponse);
      }
      return Promise.resolve(receivedResponse);
    });
    currentLocation = null;
  });

  afterEach(() => {
    cleanup();
  });

  it('navigates to received feedback details from the view action', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/employee/360-feedback/received']}>
        <LocationProbe />
        <Routes>
          <Route path="/employee/360-feedback/received" element={<GetFeedbackPage />} />
          <Route path="/employee/360-feedback/received/:feedbackId" element={<FeedbackDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Anonymous');
    await user.click(screen.getByTitle('View details'));

    await waitFor(() => {
      expect(currentLocation?.pathname).toBe('/employee/360-feedback/received/7');
    });
    expect(await screen.findByText('Received Feedback Details')).toBeTruthy();
    expect(screen.getByText('Teamwork')).toBeTruthy();
    expect(screen.getByText('Collaborative')).toBeTruthy();
  });

  it('renders evaluator role as dash for anonymous received feedback', async () => {
    render(
      <MemoryRouter initialEntries={['/employee/360-feedback/received']}>
        <LocationProbe />
        <Routes>
          <Route path="/employee/360-feedback/received" element={<GetFeedbackPage />} />
          <Route path="/employee/360-feedback/received/:feedbackId" element={<FeedbackDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Anonymous');
    const roleCells = screen.getAllByText('-');
    expect(roleCells.length).toBeGreaterThan(0);
    expect(screen.queryByText('PEER')).toBeNull();
  });
});
