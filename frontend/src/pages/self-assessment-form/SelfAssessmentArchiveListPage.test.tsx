import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SelfAssessmentArchiveListPage } from './SelfAssessmentArchiveListPage';

vi.mock('../../features/selfAssessmentForm/api/selfAssessmentFormApi', () => ({
  useGetArchiveListQuery: vi.fn(),
}));

import { useGetArchiveListQuery } from '../../features/selfAssessmentForm/api/selfAssessmentFormApi';

const mockUseGetArchiveListQuery = vi.mocked(useGetArchiveListQuery);

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SelfAssessmentArchiveListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the archive page header', () => {
    mockUseGetArchiveListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
    } as any);

    renderInRouter(<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />);
    expect(screen.getByText('Archive Self-Assessment')).toBeInTheDocument();
    expect(screen.getByText('View rejected self-assessment snapshots')).toBeInTheDocument();
  });

  it('renders empty state when no archived snapshots', () => {
    mockUseGetArchiveListQuery.mockReturnValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
      isLoading: false,
      isFetching: false,
    } as any);

    renderInRouter(<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />);
    expect(screen.getByText('No archived self-assessments found.')).toBeInTheDocument();
  });

  it('renders archived rows with employee data', () => {
    mockUseGetArchiveListQuery.mockReturnValue({
      data: {
        content: [
          {
            id: 1,
            originalFormId: 10,
            employeeId: 100,
            employeeName: 'John Doe',
            employeeStaffNo: 'STF001',
            departmentName: 'Engineering',
            positionName: 'Developer',
            templateTitle: 'Q1 Review',
            cycleName: 'Cycle 1',
            archivedStatus: 'MANAGER_REVIEWED',
            rejectionReason: 'Needs revision',
            hrUserId: 1,
            hrUserName: 'HR Admin',
            archivedAt: '2026-05-30T10:00:00Z',
            retakeDeadline: '2026-06-15',
            totalScore: 75,
            managerRevisedTotalScore: null,
            finalApprovedTotalScore: null,
            ratingCategory: 'Meets Expectations',
            formSnapshot: '{}',
          },
        ],
        totalElements: 1,
        totalPages: 1,
      },
      isLoading: false,
      isFetching: false,
    } as any);

    renderInRouter(<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('STF001')).toBeInTheDocument();
    expect(screen.getByText('Q1 Review')).toBeInTheDocument();
    expect(screen.getByText('Cycle 1')).toBeInTheDocument();
    expect(screen.getByText('HR Admin')).toBeInTheDocument();
    expect(screen.getByText('MANAGER_REVIEWED')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    mockUseGetArchiveListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: false,
    } as any);

    renderInRouter(<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />);
    expect(screen.getByText('Loading archive...')).toBeInTheDocument();
  });

  it('renders search input', () => {
    mockUseGetArchiveListQuery.mockReturnValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
      isLoading: false,
      isFetching: false,
    } as any);

    renderInRouter(<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />);
    expect(screen.getByPlaceholderText('Search by employee, template, reason...')).toBeInTheDocument();
  });
});
