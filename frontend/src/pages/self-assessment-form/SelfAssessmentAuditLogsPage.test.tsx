import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SelfAssessmentAuditLogsPage } from './SelfAssessmentAuditLogsPage';

const auditHookMock = vi.fn();

vi.mock('../../features/audit/auditApi', () => ({
  useGetSelfAssessmentAuditLogsQuery: () => auditHookMock(),
}));

const auditRows = [
  {
    id: 1,
    actionType: 'SELF_ASSESSMENT_FORM_SUBMITTED',
    targetType: 'SELF_ASSESSMENT_FORM',
    targetId: 500,
    performedByUserId: 10,
    performedByUserName: 'Aye Aye',
    description: 'Employee submitted self-assessment form',
    metadataJson: '',
    beforeData: '',
    afterData: '',
    createdAt: '2026-05-05T09:30:00Z',
    employeeDbId: 200,
    employeeId: 'EMP-200',
    employeeName: 'Mya Mya',
    formTitle: 'Engineering Developer Review',
    formStatus: 'SUBMITTED',
    cycleId: 7,
    cycleName: 'Q2 2026',
    templateTitle: 'Engineering Developer Review',
  },
  {
    id: 2,
    actionType: 'SELF_ASSESSMENT_FORM_TEMPLATE_UPDATED',
    targetType: 'SELF_ASSESSMENT_FORM_TEMPLATE',
    targetId: 100,
    performedByUserId: 11,
    performedByUserName: 'Hnin Hnin',
    description: 'Template updated',
    metadataJson: '',
    beforeData: '',
    afterData: '',
    createdAt: '2026-05-04T08:15:00Z',
    templateTitle: 'Sales Review Template',
  },
];

describe('SelfAssessmentAuditLogsPage', () => {
  beforeEach(() => {
    auditHookMock.mockReturnValue({ data: auditRows, isLoading: false, isError: false });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders self-assessment audit rows and expanded context', async () => {
    const user = userEvent.setup();
    render(<SelfAssessmentAuditLogsPage />);

    expect(screen.getByRole('heading', { name: 'Self-Assessment Audit Logs' })).toBeInTheDocument();
    expect(screen.getByText('Aye Aye')).toBeInTheDocument();
    expect(screen.getByText('Mya Mya / Engineering Developer Review / SUBMITTED / Q2 2026')).toBeInTheDocument();
    expect(screen.getByText('Sales Review Template')).toBeInTheDocument();

    await user.click(screen.getByText('Employee submitted self-assessment form'));

    expect(screen.getByText('Employee DB ID:')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('Cycle ID:')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('filters by target type', async () => {
    const user = userEvent.setup();
    render(<SelfAssessmentAuditLogsPage />);

    await user.selectOptions(screen.getByRole('combobox'), 'TEMPLATES');

    expect(screen.queryByText('Mya Mya / Engineering Developer Review / SUBMITTED / Q2 2026')).not.toBeInTheDocument();
    expect(screen.getByText('Sales Review Template')).toBeInTheDocument();
  });

  it('searches by employee, form, and action text', async () => {
    const user = userEvent.setup();
    render(<SelfAssessmentAuditLogsPage />);

    await user.type(screen.getByRole('textbox'), 'mya');
    expect(screen.getByText('Mya Mya / Engineering Developer Review / SUBMITTED / Q2 2026')).toBeInTheDocument();
    expect(screen.queryByText('Sales Review Template')).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'template updated');
    expect(screen.getByText('Sales Review Template')).toBeInTheDocument();
    expect(screen.queryByText('Mya Mya / Engineering Developer Review / SUBMITTED / Q2 2026')).not.toBeInTheDocument();
  });

  it('renders loading, error, and empty states', () => {
    auditHookMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { rerender } = render(<SelfAssessmentAuditLogsPage />);
    expect(screen.getByText('Loading Audit Logs...')).toBeInTheDocument();

    auditHookMock.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    rerender(<SelfAssessmentAuditLogsPage />);
    expect(screen.getByText('Failed to load audit logs. Please try again.')).toBeInTheDocument();

    auditHookMock.mockReturnValue({ data: [], isLoading: false, isError: false });
    rerender(<SelfAssessmentAuditLogsPage />);
    expect(screen.getByText('No audit logs found matching your filters.')).toBeInTheDocument();
  });
});
