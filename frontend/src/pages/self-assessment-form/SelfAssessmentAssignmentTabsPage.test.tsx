import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SelfAssessmentAssignmentTabsPage } from './SelfAssessmentAssignmentTabsPage';

vi.mock('./SelfAssessmentAssignmentsPage', () => ({
  SelfAssessmentAssignmentsPage: () => <div data-testid="overview-page">Overview page content</div>,
}));

vi.mock('./AssignSelfAssessmentFormsPage', () => ({
  AssignSelfAssessmentFormsPage: ({ onAssignmentSuccess }: { onAssignmentSuccess?: () => void }) => (
    <div data-testid="assign-page">
      Assign page content
      <button type="button" onClick={onAssignmentSuccess}>
        Complete assignment
      </button>
    </div>
  ),
}));

function LocationState() {
  const location = useLocation();
  return <div data-testid="location-state">{`${location.pathname}${location.search}`}</div>;
}

function renderAssignmentRoutes(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/hr/self-assessment/assignments"
          element={
            <>
              <LocationState />
              <SelfAssessmentAssignmentTabsPage />
            </>
          }
        />
        <Route
          path="/hr/self-assessment/assign-forms"
          element={<Navigate to="/hr/self-assessment/assignments?tab=assign" replace />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SelfAssessmentAssignmentTabsPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders overview and assign forms tabs with overview selected by default', () => {
    renderAssignmentRoutes('/hr/self-assessment/assignments');

    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Assign Forms' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByTestId('overview-page')).toBeInTheDocument();
  });

  it('opens the assign tab from the old bookmark-safe route', () => {
    renderAssignmentRoutes('/hr/self-assessment/assign-forms');

    expect(screen.getByTestId('location-state')).toHaveTextContent('/hr/self-assessment/assignments?tab=assign');
    expect(screen.getByRole('tab', { name: 'Assign Forms' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('assign-page')).toBeInTheDocument();
  });

  it('returns to the overview tab after a successful assignment', async () => {
    const user = userEvent.setup();
    renderAssignmentRoutes('/hr/self-assessment/assignments?tab=assign');

    await user.click(screen.getByRole('button', { name: 'Complete assignment' }));

    expect(screen.getByTestId('location-state')).toHaveTextContent('/hr/self-assessment/assignments?tab=overview');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('overview-page')).toBeInTheDocument();
  });
});
