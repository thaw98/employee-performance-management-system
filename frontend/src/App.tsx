// src/App.tsx
import type { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { ThemeBootstrap } from './components/layout/ThemeBootstrap';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { PermissionGate } from './routes/PermissionGate';
import { LoginPage } from './pages/auth/LoginPage';
import { FirstLoginPasswordPage } from './pages/auth/FirstLoginPasswordPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyOtpPage } from './pages/auth/VerifyOtpPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Layouts
import HrLayout from './layouts/HrLayout';
import ManagerLayout from './layouts/ManagerLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Add these imports
import AuditLayout from './layouts/AuditLayout';
import { AuditDashboard } from './pages/audit/AuditDashboard';
import { AuditLogsPage } from './pages/audit/AuditLogsPage';
import { AuditActivityPage } from './pages/audit/AuditActivityPage';
import { AuditFeedbackEvaluateeHistoryPage, AuditFeedbackHistoryPage } from './pages/audit/AuditFeedbackHistoryPage';
import PermissionMatrixPage from './pages/audit/permissions';
// Dashboard Pages - Using the correct file names from your project
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerKpisPage } from './pages/manager/ManagerKpisPage';
import ManagerPositionsPage from './pages/manager/ManagerPositionsPage';
import { PromotionApprovalsPage } from './pages/manager/PromotionApprovalsPage';
import { ManagerAppraisalsPage } from './pages/manager/ManagerAppraisalsPage';
import { ManagerEvaluationPage } from './pages/manager/ManagerEvaluationPage';
import { MyKpisPage } from './pages/employee/MyKpisPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { EmployeeAppraisalsPage } from './pages/employee/EmployeeAppraisalsPage';
import { EmployeeAppraisalViewPage } from './pages/employee/EmployeeAppraisalViewPage';
import { AppraisalHistoryPage } from './pages/appraisals/AppraisalHistoryPage';
import { CreateEmployeeAccountPage } from './pages/hr/CreateEmployeeAccountPage';
import EmployeeListPage from './pages/hr/employees/EmployeeListPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { ScoreExplanationSettingsPage } from './pages/ScoreExplanationSettingsPage';
import { TimeSettingsPage } from './pages/TimeSettingsPage';
import { DefaultSignaturePage } from './pages/DefaultSignaturePage';
import { FaqSupportPage } from './pages/hr/FaqSupportPage';
import { FaqPage } from './pages/FaqPage';

// Performance Modules
import PipMonitoringPage from './pages/PipMonitoringPage';
import PipCreatePage from './pages/PipCreatePage';
import PipDetailPage from './pages/PipDetailPage';
import PipNotesReviewPage from './pages/hr/PipNotesReviewPage';
import FeedbackManagementPage from './pages/hr/FeedbackManagementPage';
import { AppraisalsPage } from './pages/hr/AppraisalsPage';
import { GiveFeedbackPage } from './pages/GiveFeedbackPage';
import { CombinedFeedbackHistoryPage } from './pages/CombinedFeedbackHistoryPage';
import { GetFeedbackPage } from './pages/GetFeedbackPage';
import { FeedbackDetailPage } from './pages/FeedbackDetailPage';
import { KpiManagementPage } from './pages/hr/KpiManagementPage';
import { KpiAssignedPage } from './pages/hr/KpiAssignedPage';
import { KpiDetailPage } from './pages/hr/KpiDetailPage';
import { DepartmentKpiDetailPage } from './pages/hr/DepartmentKpiDetailPage';
import { PositionKpiDetailPage } from './pages/hr/PositionKpiDetailPage';
import { KpiCategoryPage } from './pages/hr/KpiCategoryPage';
import { KpiUnitPage } from './pages/hr/KpiUnitPage';
import { KpiNamePage } from './pages/hr/KpiNamePage';
import { KpiHistoryPage } from './pages/hr/KpiHistoryPage';
import KpiReportsPage from './pages/hr/KpiReportsPage';
import { AppraisalSubmissionsPage } from './pages/hr/AppraisalSubmissionsPage';
import DepartmentDetailPage from './pages/hr/departments/DepartmentDetailPage';
import DepartmentEmployeeListPage from './pages/hr/departments/DepartmentEmployeeListPage';
import DepartmentListPage from './pages/hr/departments/DepartmentListPage';
import PositionListPage from './features/position/pages/PositionListPage';
import LevelCodeListPage from './features/levelCode/pages/LevelCodeListPage';

// Self Assessment (HR templates & employee flows)
import { SelfAssessmentFormTemplatePage } from './pages/self-assessment-form/SelfAssessmentFormTemplatePage';
import { CreateSelfAssessmentTemplatePage } from './pages/self-assessment-form/CreateSelfAssessmentTemplatePage';
import { EditSelfAssessmentTemplatePage } from './pages/self-assessment-form/EditSelfAssessmentTemplatePage';
import { MySelfAssessmentFormPage } from './pages/self-assessment-form/MySelfAssessmentFormPage';
import { EmployeeSelfAssessmentHubPage } from './pages/self-assessment-form/EmployeeSelfAssessmentHubPage';
import { SelfAssessmentFormReviewPage } from './pages/self-assessment-form/SelfAssessmentFormReviewPage';
import { SelfAssessmentFormQueuePage } from './pages/self-assessment-form/SelfAssessmentFormQueuePage';
import { SelfAssessmentActiveFormsPage } from './pages/self-assessment-form/SelfAssessmentActiveFormsPage';
import { QuestionBankPage } from './pages/self-assessment-form/QuestionBankPage';
import { SelfAssessmentAssignmentsPage } from './pages/self-assessment-form/SelfAssessmentAssignmentsPage';
import { AssignSelfAssessmentFormsPage } from './pages/self-assessment-form/AssignSelfAssessmentFormsPage';
import { SelfAssessmentSettingsPage } from './pages/self-assessment-form/SelfAssessmentSettingsPage';
import { SelfAssessmentAssignedEmployeesPage } from './pages/self-assessment-form/SelfAssessmentAssignedEmployeesPage';
import { SelfAssessmentScoreRecordsPage } from './pages/self-assessment-form/SelfAssessmentScoreRecordsPage';
import { SelfAssessmentUnlockRequestsPage } from './pages/self-assessment-form/SelfAssessmentUnlockRequestsPage';
import { SelfAssessmentArchiveListPage } from './pages/self-assessment-form/SelfAssessmentArchiveListPage';
import { SelfAssessmentArchiveDetailPage } from './pages/self-assessment-form/SelfAssessmentArchiveDetailPage';

// Meetings
import { MeetingsPage } from './pages/manager/MeetingsPage';
import { EmployeeMeetingsPage } from './pages/employee/EmployeeMeetingsPage';
import { MeetingDetailPage } from './pages/meetings/MeetingDetailPage';
import { NotificationPage } from './pages/NotificationPage';

// Reports Pages
import ManagerKpiReportsPage from './pages/manager/KpiReportsPage';
import ManagerReportsPage from './pages/reports/manager/PipReportPage';
import HrReportsPage from './pages/reports/hr/PipReportPage';
import EmployeeReportsPage from './pages/reports/employee/PipReportPage';
import FeedbackReportPage from './pages/reports/FeedbackReportPage';
import AppraisalReportsPage from './pages/hr/AppraisalReportsPage';
import SelfAssessmentReportPage from './pages/reports/SelfAssessmentReportPage';
import PerformanceReportPage from './pages/hr/PerformanceReportPage';
import PerformanceReportDetailPage from './pages/hr/PerformanceReportDetailPage';

// Continuous Feedback
import ContinuousFeedbackPage from './pages/continuous-feedback/ContinuousFeedbackPage';
import ContinuousFeedbackCreatePage from './pages/continuous-feedback/ContinuousFeedbackCreatePage';
import ContinuousFeedbackDetailPage from './pages/continuous-feedback/ContinuousFeedbackDetailPage';
import ContinuousFeedbackDashboardPage from './pages/continuous-feedback/ContinuousFeedbackDashboardPage';
import EmployeeContinuousFeedbackPage from './pages/continuous-feedback/EmployeeContinuousFeedbackPage';
import { usePermissionState } from './features/permission';

const TOAST_DEDUP_MS = 600;
const recentToastTimestamps = new Map<string, number>();
let isToastPatched = false;

function shouldSuppressToast(kind: 'success' | 'error', message: unknown): boolean {
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  if (!normalizedMessage) {
    return false;
  }

  const key = `${kind}:${normalizedMessage}`;
  const now = Date.now();
  const previous = recentToastTimestamps.get(key);

  if (previous && now - previous < TOAST_DEDUP_MS) {
    return true;
  }

  recentToastTimestamps.set(key, now);
  return false;
}

function patchToastDuplicateGuard() {
  if (isToastPatched) {
    return;
  }

  const originalSuccess = toast.success.bind(toast);
  const originalError = toast.error.bind(toast);

  toast.success = ((message, options) => {
    if (shouldSuppressToast('success', message)) {
      return '';
    }
    return originalSuccess(message, options);
  }) as typeof toast.success;

  toast.error = ((message, options) => {
    if (shouldSuppressToast('error', message)) {
      return '';
    }
    return originalError(message, options);
  }) as typeof toast.error;

  isToastPatched = true;
}

patchToastDuplicateGuard();

function gated(moduleKey: string, actionKey: string, element: ReactNode) {
  return <PermissionGate moduleKey={moduleKey} actionKey={actionKey}>{element}</PermissionGate>;
}

function App() {
  usePermissionState();

  return (
    <Router>
      <AuthBootstrap />
      <ThemeBootstrap />
      <Toaster position="bottom-center" />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/first-login/set-password" element={<FirstLoginPasswordPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* HR Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['HR']} />}>
          <Route path="/hr" element={<HrLayout />}>
            <Route path="dashboard" element={<HRDashboardPage />} />
            <Route path="employees" element={gated('EMPLOYEE_PROFILE', 'view_employee', <EmployeeListPage />)} />
            <Route path="employees/create-account" element={gated('EMPLOYEE_PROFILE', 'manage_employee', <CreateEmployeeAccountPage />)} />
            <Route path="departments" element={gated('EMPLOYEE_PROFILE', 'view_org_setup', <DepartmentListPage />)} />
            <Route path="departments/:departmentId/employees" element={<DepartmentEmployeeListPage />} />
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
            <Route path="positions" element={gated('EMPLOYEE_PROFILE', 'view_org_setup', <PositionListPage />)} />
            <Route path="level-codes" element={gated('EMPLOYEE_PROFILE', 'view_org_setup', <LevelCodeListPage />)} />

            <Route path="pip-monitoring" element={gated('PIP', 'view', <PipMonitoringPage />)} />
            <Route path="pip-monitoring/:id" element={gated('PIP', 'view', <PipDetailPage />)} />
            <Route path="pip-notes" element={gated('PIP', 'review_notes', <PipNotesReviewPage />)} />
            <Route path="360-feedback/management" element={gated('360_FEEDBACK', 'configure', <FeedbackManagementPage />)} />
            <Route path="360-feedback/criteria" element={<Navigate to="/hr/360-feedback/management" replace />} />
            <Route path="360-feedback/give" element={gated('360_FEEDBACK', 'give', <GiveFeedbackPage />)} />
            <Route path="360-feedback/received" element={gated('360_FEEDBACK', 'view', <GetFeedbackPage />)} />
            <Route path="360-feedback/received/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/history" element={gated('360_FEEDBACK', 'review_history', <CombinedFeedbackHistoryPage />)} />
            <Route path="360-feedback/history/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/hr/360-feedback/history" replace />} />
            <Route path="appraisals" element={<AppraisalsPage />} />
            <Route path="appraisals/submissions" element={<AppraisalSubmissionsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="hr" />} />
            <Route path="kpi-management" element={gated('KPI', 'manage', <KpiManagementPage />)} />
            <Route path="kpi-assigned" element={gated('KPI', 'assign', <KpiAssignedPage />)} />
            <Route path="kpi-detail" element={gated('KPI', 'view', <KpiDetailPage />)} />
            <Route path="department-kpi-detail" element={<DepartmentKpiDetailPage />} />
            <Route path="position-kpi-detail" element={<PositionKpiDetailPage />} />
            <Route path="kpi-categories" element={gated('KPI', 'configure', <KpiCategoryPage />)} />
            <Route path="kpi-units" element={gated('KPI', 'configure', <KpiUnitPage />)} />
            <Route path="kpi-names" element={gated('KPI', 'configure', <KpiNamePage />)} />
            <Route path="kpi-history" element={gated('KPI', 'history', <KpiHistoryPage />)} />
            <Route path="kpi-reports" element={gated('KPI', 'report', <KpiReportsPage />)} />
            <Route path='AppraisalSubmissionsPage' element={<AppraisalSubmissionsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/hr/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
	            <Route path="settings/system" element={<SystemSettingsPage />} />
	            <Route path="settings/system/time" element={<TimeSettingsPage />} />
	            <Route path="settings/system/score-explanations" element={<ScoreExplanationSettingsPage />} />
            <Route path="settings/faq-support" element={<FaqSupportPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment/templates" element={gated('SELF_ASSESSMENT', 'manage_templates', <SelfAssessmentFormTemplatePage />)} />
            <Route path="self-assessment/templates/create" element={gated('SELF_ASSESSMENT', 'manage_templates', <CreateSelfAssessmentTemplatePage />)} />
            <Route path="self-assessment/templates/:templateId/edit" element={gated('SELF_ASSESSMENT', 'manage_templates', <EditSelfAssessmentTemplatePage />)} />
            <Route path="self-assessment/assignments" element={gated('SELF_ASSESSMENT', 'assign', <SelfAssessmentAssignmentsPage />)} />
            <Route path="self-assessment/assignments/:templateId/assigned-employees" element={<SelfAssessmentAssignedEmployeesPage />} />
            <Route
              path="self-assessment/assign-forms"
              element={gated('SELF_ASSESSMENT', 'assign', <AssignSelfAssessmentFormsPage />)}
            />
            <Route path="self-assessment/forms" element={gated('SELF_ASSESSMENT', 'view', <SelfAssessmentActiveFormsPage />)} />
            <Route
              path="self-assessment/forms/create"
              element={<Navigate to="/hr/self-assessment/templates/create" replace />}
            />
            <Route path="self-assessment/question-bank" element={gated('SELF_ASSESSMENT', 'manage_templates', <QuestionBankPage />)} />
            <Route path="self-assessment/review-queue" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormQueuePage />)} />
            <Route path="self-assessment/unlock-requests" element={gated('SELF_ASSESSMENT', 'unlock', <SelfAssessmentUnlockRequestsPage />)} />
            <Route path="self-assessment/reviews" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormReviewPage />)} />
            <Route path="self-assessment/reviews/:formId" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormReviewPage />)} />
            <Route path="self-assessment/settings" element={gated('SELF_ASSESSMENT', 'configure', <SelfAssessmentSettingsPage />)} />
            <Route path="self-assessment/history" element={gated('SELF_ASSESSMENT', 'history', <SelfAssessmentScoreRecordsPage />)} />
            <Route path="self-assessment/archive" element={<SelfAssessmentArchiveListPage basePath="/hr/self-assessment" />} />
            <Route path="self-assessment/archive/:archiveId" element={<SelfAssessmentArchiveDetailPage basePath="/hr/self-assessment" />} />
            <Route
              path="self-assessment/score-records"
              element={<Navigate to="/hr/self-assessment/history" replace />}
            />
            <Route path="meetings" element={gated('MEETINGS', 'view', <MeetingsPage />)} />
            <Route path="meetings/:id" element={gated('MEETINGS', 'view', <MeetingDetailPage />)} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="reports" element={gated('REPORTS', 'pip_report', <HrReportsPage />)} />
            <Route path="reports/feedback" element={gated('REPORTS', 'feedback_report', <FeedbackReportPage mode="hr" />)} />
            <Route path="reports/appraisal" element={gated('REPORTS', 'appraisal_report', <AppraisalReportsPage />)} />
            <Route path="reports/self-assessment" element={gated('REPORTS', 'self_assessment_report', <SelfAssessmentReportPage mode="hr" />)} />
            <Route path="performance-reports" element={gated('REPORTS', 'performance_report', <PerformanceReportPage />)} />
            <Route path="performance-reports/:employeeId" element={gated('REPORTS', 'performance_report', <PerformanceReportDetailPage />)} />
            <Route path="continuous-feedback" element={gated('CONTINUOUS_FEEDBACK', 'view', <ContinuousFeedbackPage />)} />
            <Route path="continuous-feedback/dashboard" element={gated('CONTINUOUS_FEEDBACK', 'report', <ContinuousFeedbackDashboardPage />)} />
            <Route path="continuous-feedback/:feedbackId" element={gated('CONTINUOUS_FEEDBACK', 'view', <ContinuousFeedbackDetailPage />)} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['MANAGER']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route path="dashboard" element={<ManagerDashboardPage />} />
            <Route path="employees" element={gated('EMPLOYEE_PROFILE', 'view_employee', <EmployeeListPage />)} />
            <Route path="positions" element={gated('EMPLOYEE_PROFILE', 'view_org_setup', <ManagerPositionsPage />)} />
            <Route path="promotions/approvals" element={<PromotionApprovalsPage />} />
            <Route path="kpis" element={gated('KPI', 'view', <ManagerKpisPage />)} />
            <Route path="kpi-history" element={gated('KPI', 'history', <KpiHistoryPage />)} />
            <Route path="my-kpis" element={gated('KPI', 'view', <MyKpisPage />)} />
            <Route path="pip" element={gated('PIP', 'view', <PipMonitoringPage />)} />
            <Route path="pip/create" element={gated('PIP', 'create', <PipCreatePage />)} />
            <Route path="pip/:id" element={gated('PIP', 'view', <PipDetailPage />)} />
            <Route path="appraisals" element={<ManagerAppraisalsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="manager" />} />
            <Route path="appraisals/:id/evaluate" element={<ManagerEvaluationPage />} />
            <Route path="360-feedback/give" element={gated('360_FEEDBACK', 'give', <GiveFeedbackPage />)} />
            <Route path="360-feedback/received" element={gated('360_FEEDBACK', 'view', <GetFeedbackPage />)} />
            <Route path="360-feedback/received/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/history" element={gated('360_FEEDBACK', 'review_history', <CombinedFeedbackHistoryPage />)} />
            <Route path="360-feedback/history/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/manager/360-feedback/history" replace />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/manager/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment/templates" element={gated('SELF_ASSESSMENT', 'manage_templates', <SelfAssessmentFormTemplatePage />)} />
            <Route path="self-assessment/templates/:templateId/edit" element={gated('SELF_ASSESSMENT', 'manage_templates', <EditSelfAssessmentTemplatePage />)} />
            <Route path="self-assessment/question-bank" element={gated('SELF_ASSESSMENT', 'manage_templates', <QuestionBankPage />)} />
            <Route path="self-assessment/forms" element={gated('SELF_ASSESSMENT', 'view', <SelfAssessmentActiveFormsPage />)} />
            <Route path="self-assessment-forms/my-form" element={gated('SELF_ASSESSMENT', 'view', <MySelfAssessmentFormPage />)} />
            <Route path="self-assessment-forms/review-queue" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormQueuePage />)} />
            <Route path="self-assessment-forms/reviews" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormReviewPage />)} />
            <Route path="self-assessment-forms/reviews/:formId" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormReviewPage />)} />
            <Route path="self-assessment-forms/history" element={gated('SELF_ASSESSMENT', 'history', <SelfAssessmentScoreRecordsPage />)} />
            <Route
              path="self-assessment-forms/score-records"
              element={<Navigate to="/manager/self-assessment-forms/history" replace />}
            />
            <Route path="meetings" element={gated('MEETINGS', 'view', <MeetingsPage />)} />
            <Route path="meetings/:id" element={gated('MEETINGS', 'view', <MeetingDetailPage />)} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="reports" element={gated('REPORTS', 'pip_report', <ManagerReportsPage />)} />
            <Route path="reports/kpi" element={gated('REPORTS', 'kpi_report', <ManagerKpiReportsPage />)} />
            <Route path="reports/feedback" element={gated('REPORTS', 'feedback_report', <FeedbackReportPage mode="manager" />)} />
            <Route path="reports/appraisal" element={gated('REPORTS', 'appraisal_report', <AppraisalReportsPage mode="manager" />)} />
            <Route path="reports/self-assessment" element={gated('REPORTS', 'self_assessment_report', <SelfAssessmentReportPage mode="manager" />)} />
            <Route path="continuous-feedback" element={gated('CONTINUOUS_FEEDBACK', 'view', <ContinuousFeedbackPage />)} />
            <Route path="continuous-feedback/create" element={gated('CONTINUOUS_FEEDBACK', 'create', <ContinuousFeedbackCreatePage />)} />
            <Route path="continuous-feedback/:feedbackId" element={gated('CONTINUOUS_FEEDBACK', 'view', <ContinuousFeedbackDetailPage />)} />
            <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
          </Route>
        </Route>

        {/* Employee Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['EMPLOYEE']} />}>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route path="dashboard" element={<EmployeeDashboardPage />} />
            <Route path="kpis" element={gated('KPI', 'view', <MyKpisPage />)} />
            <Route path="pip" element={gated('PIP', 'view', <PipMonitoringPage />)} />
            <Route path="pip/:id" element={gated('PIP', 'view', <PipDetailPage />)} />
            <Route path="360-feedback/give" element={gated('360_FEEDBACK', 'give', <GiveFeedbackPage />)} />
            <Route path="360-feedback/received" element={gated('360_FEEDBACK', 'view', <GetFeedbackPage />)} />
            <Route path="360-feedback/received/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/history" element={gated('360_FEEDBACK', 'review_history', <CombinedFeedbackHistoryPage />)} />
            <Route path="360-feedback/history/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/employee/360-feedback/history" replace />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/employee/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment-forms" element={gated('SELF_ASSESSMENT', 'view', <EmployeeSelfAssessmentHubPage />)} />
            <Route path="self-assessment-forms/my-form" element={gated('SELF_ASSESSMENT', 'view', <MySelfAssessmentFormPage />)} />
            <Route path="self-assessment-forms/history" element={gated('SELF_ASSESSMENT', 'history', <SelfAssessmentScoreRecordsPage />)} />
            <Route path="self-assessment-forms/reviews/:formId" element={gated('SELF_ASSESSMENT', 'review', <SelfAssessmentFormReviewPage />)} />
            <Route path="meetings" element={gated('MEETINGS', 'view', <EmployeeMeetingsPage />)} />
            <Route path="meetings/:id" element={gated('MEETINGS', 'view', <MeetingDetailPage />)} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="appraisals" element={<EmployeeAppraisalsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="employee" />} />
            <Route path="appraisals/:id/view" element={<EmployeeAppraisalViewPage />} />
            <Route path="reports" element={gated('REPORTS', 'pip_report', <EmployeeReportsPage />)} />
            <Route path="reports/feedback" element={gated('REPORTS', 'feedback_report', <FeedbackReportPage mode="employee" />)} />
            <Route path="continuous-feedback" element={gated('CONTINUOUS_FEEDBACK', 'view', <EmployeeContinuousFeedbackPage />)} />
            <Route path="continuous-feedback/:feedbackId" element={gated('CONTINUOUS_FEEDBACK', 'view', <ContinuousFeedbackDetailPage />)} />
            <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
          </Route>
        </Route>

        {/* Audit Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['AUDIT']} />}>
          <Route path="/audit" element={<AuditLayout />}>
            <Route index element={<Navigate to="/audit/dashboard" replace />} />
            <Route path="dashboard" element={<AuditDashboard />} />
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="employees/create-account" element={<CreateEmployeeAccountPage />} />
            <Route path="departments" element={<DepartmentListPage />} />
            <Route path="departments/:departmentId/employees" element={<DepartmentEmployeeListPage />} />
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
            <Route path="positions" element={<PositionListPage />} />
            <Route path="level-codes" element={<LevelCodeListPage />} />
            <Route path="kpi-assigned" element={<KpiAssignedPage />} />
            <Route path="kpi-history" element={<KpiHistoryPage />} />
            <Route path="kpi-detail" element={<KpiDetailPage />} />
            <Route path="department-kpi-detail" element={<DepartmentKpiDetailPage />} />
            <Route path="position-kpi-detail" element={<PositionKpiDetailPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="hr" readOnly />} />
            <Route path="pip-monitoring" element={<PipMonitoringPage />} />
            <Route path="pip-monitoring/:id" element={<PipDetailPage />} />
            <Route path="pip-notes" element={<PipNotesReviewPage />} />
            <Route path="self-assessment/history" element={<SelfAssessmentScoreRecordsPage />} />
            <Route path="self-assessment/archive" element={<SelfAssessmentArchiveListPage basePath="/audit/self-assessment" />} />
            <Route path="self-assessment/archive/:archiveId" element={<SelfAssessmentArchiveDetailPage basePath="/audit/self-assessment" />} />
            <Route path="self-assessment/reviews/:formId" element={<SelfAssessmentFormReviewPage readOnly />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="360-feedback/history" element={<AuditFeedbackHistoryPage />} />
            <Route path="360-feedback/history/:employeeId" element={<AuditFeedbackEvaluateeHistoryPage />} />
            <Route path="360-feedback/history/:employeeId/:feedbackId" element={<FeedbackDetailPage />} />
            <Route path="reports" element={<HrReportsPage />} />
            <Route path="reports/feedback" element={<FeedbackReportPage mode="audit" />} />
            <Route path="reports/appraisal" element={<AppraisalReportsPage />} />
            <Route path="reports/self-assessment" element={<SelfAssessmentReportPage mode="audit" />} />
            <Route path="kpi-reports" element={<KpiReportsPage />} />
            <Route path="performance-reports" element={<PerformanceReportPage basePath="/audit/performance-reports" readOnly />} />
            <Route path="performance-reports/:employeeId" element={<PerformanceReportDetailPage basePath="/audit/performance-reports" readOnly />} />
            <Route path="continuous-feedback" element={<ContinuousFeedbackPage />} />
            <Route path="continuous-feedback/dashboard" element={<ContinuousFeedbackDashboardPage />} />
            <Route path="continuous-feedback/:feedbackId" element={<ContinuousFeedbackDetailPage />} />
            <Route path="logs" element={<AuditLogsPage />} />
            <Route path="activity-monitor" element={<AuditActivityPage />} />
            <Route path="permissions" element={<PermissionMatrixPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/audit/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="*" element={<Navigate to="/audit/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
