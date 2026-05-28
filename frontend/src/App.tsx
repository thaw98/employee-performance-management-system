// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { ThemeBootstrap } from './components/layout/ThemeBootstrap';
import { ProtectedRoute } from './routes/ProtectedRoute';
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
import { SecurityAnalytics } from './pages/audit/SecurityAnalytics';

// Dashboard Pages - Using the correct file names from your project
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerKpisPage } from './pages/manager/ManagerKpisPage';
import ManagerPositionsPage from './pages/manager/ManagerPositionsPage';
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
import { TimeSettingsPage } from './pages/TimeSettingsPage';
import { DefaultSignaturePage } from './pages/DefaultSignaturePage';
import { FaqSupportPage } from './pages/hr/FaqSupportPage';
import { FaqPage } from './pages/FaqPage';

// Performance Modules
import PipMonitoringPage from './pages/PipMonitoringPage';
import PipCreatePage from './pages/PipCreatePage';
import PipDetailPage from './pages/PipDetailPage';
import PipNotesReviewPage from './pages/hr/PipNotesReviewPage';
import { CriteriaPage } from './pages/hr/CriteriaPage';
import { AppraisalsPage } from './pages/hr/AppraisalsPage';
import { GiveFeedbackPage } from './pages/GiveFeedbackPage';
import { CombinedFeedbackHistoryPage } from './pages/CombinedFeedbackHistoryPage';
import { GetFeedbackPage } from './pages/GetFeedbackPage';
import { KpiManagementPage } from './pages/hr/KpiManagementPage';
import { KpiAssignedPage } from './pages/hr/KpiAssignedPage';
import { KpiDetailPage } from './pages/hr/KpiDetailPage';
import { DepartmentKpiDetailPage } from './pages/hr/DepartmentKpiDetailPage';
import { PositionKpiDetailPage } from './pages/hr/PositionKpiDetailPage';
import { KpiCategoryPage } from './pages/hr/KpiCategoryPage';
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

function App() {
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
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="employees/create-account" element={<CreateEmployeeAccountPage />} />
            <Route path="departments" element={<DepartmentListPage />} />
            <Route path="departments/:departmentId/employees" element={<DepartmentEmployeeListPage />} />
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
            <Route path="positions" element={<PositionListPage />} />
            <Route path="level-codes" element={<LevelCodeListPage />} />

            <Route path="pip-monitoring" element={<PipMonitoringPage />} />
            <Route path="pip-monitoring/:id" element={<PipDetailPage />} />
            <Route path="pip-notes" element={<PipNotesReviewPage />} />
            <Route path="360-feedback/criteria" element={<CriteriaPage />} />
            <Route path="360-feedback/give" element={<GiveFeedbackPage />} />
            <Route path="360-feedback/received" element={<GetFeedbackPage />} />
            <Route path="360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/hr/360-feedback/history" replace />} />
            <Route path="appraisals" element={<AppraisalsPage />} />
            <Route path="appraisals/submissions" element={<AppraisalSubmissionsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="hr" />} />
            <Route path="kpi-management" element={<KpiManagementPage />} />
            <Route path="kpi-assigned" element={<KpiAssignedPage />} />
            <Route path="kpi-detail" element={<KpiDetailPage />} />
            <Route path="department-kpi-detail" element={<DepartmentKpiDetailPage />} />
            <Route path="position-kpi-detail" element={<PositionKpiDetailPage />} />
            <Route path="kpi-categories" element={<KpiCategoryPage />} />
            <Route path="kpi-history" element={<KpiHistoryPage />} />
            <Route path="kpi-reports" element={<KpiReportsPage />} />
            <Route path='AppraisalSubmissionsPage' element={<AppraisalSubmissionsPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/hr/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="settings/system/time" element={<TimeSettingsPage />} />
            <Route path="settings/faq-support" element={<FaqSupportPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment/templates" element={<SelfAssessmentFormTemplatePage />} />
            <Route path="self-assessment/templates/create" element={<CreateSelfAssessmentTemplatePage />} />
            <Route path="self-assessment/templates/:templateId/edit" element={<EditSelfAssessmentTemplatePage />} />
            <Route path="self-assessment/assignments" element={<SelfAssessmentAssignmentsPage />} />
            <Route path="self-assessment/assignments/:templateId/assigned-employees" element={<SelfAssessmentAssignedEmployeesPage />} />
            <Route
              path="self-assessment/assign-forms"
              element={<AssignSelfAssessmentFormsPage />}
            />
            <Route path="self-assessment/forms" element={<SelfAssessmentActiveFormsPage />} />
            <Route
              path="self-assessment/forms/create"
              element={<Navigate to="/hr/self-assessment/templates/create" replace />}
            />
            <Route path="self-assessment/question-bank" element={<QuestionBankPage />} />
            <Route path="self-assessment/review-queue" element={<SelfAssessmentFormQueuePage />} />
            <Route path="self-assessment/unlock-requests" element={<SelfAssessmentUnlockRequestsPage />} />
            <Route path="self-assessment/reviews" element={<SelfAssessmentFormReviewPage />} />
            <Route path="self-assessment/reviews/:formId" element={<SelfAssessmentFormReviewPage />} />
            <Route path="self-assessment/settings" element={<SelfAssessmentSettingsPage />} />
            <Route path="self-assessment/history" element={<SelfAssessmentScoreRecordsPage />} />
            <Route
              path="self-assessment/score-records"
              element={<Navigate to="/hr/self-assessment/history" replace />}
            />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="reports" element={<HrReportsPage />} />
            <Route path="reports/feedback" element={<FeedbackReportPage mode="hr" />} />
            <Route path="reports/appraisal" element={<AppraisalReportsPage />} />
            <Route path="reports/self-assessment" element={<SelfAssessmentReportPage mode="hr" />} />
            <Route path="performance-reports" element={<PerformanceReportPage />} />
            <Route path="performance-reports/:employeeId" element={<PerformanceReportDetailPage />} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['MANAGER']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route path="dashboard" element={<ManagerDashboardPage />} />
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="positions" element={<ManagerPositionsPage />} />
            <Route path="kpis" element={<ManagerKpisPage />} />
            <Route path="kpi-history" element={<KpiHistoryPage />} />
            <Route path="my-kpis" element={<MyKpisPage />} />
            <Route path="pip" element={<PipMonitoringPage />} />
            <Route path="pip/create" element={<PipCreatePage />} />
            <Route path="pip/:id" element={<PipDetailPage />} />
            <Route path="appraisals" element={<ManagerAppraisalsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="manager" />} />
            <Route path="appraisals/:id/evaluate" element={<ManagerEvaluationPage />} />
            <Route path="360-feedback/give" element={<GiveFeedbackPage />} />
            <Route path="360-feedback/received" element={<GetFeedbackPage />} />
            <Route path="360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/manager/360-feedback/history" replace />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/manager/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment/templates" element={<SelfAssessmentFormTemplatePage />} />
            <Route path="self-assessment/templates/:templateId/edit" element={<EditSelfAssessmentTemplatePage />} />
            <Route path="self-assessment/question-bank" element={<QuestionBankPage />} />
            <Route path="self-assessment/forms" element={<SelfAssessmentActiveFormsPage />} />
            <Route path="self-assessment-forms/my-form" element={<MySelfAssessmentFormPage />} />
            <Route path="self-assessment-forms/review-queue" element={<SelfAssessmentFormQueuePage />} />
            <Route path="self-assessment-forms/reviews" element={<SelfAssessmentFormReviewPage />} />
            <Route path="self-assessment-forms/reviews/:formId" element={<SelfAssessmentFormReviewPage />} />
            <Route path="self-assessment-forms/history" element={<SelfAssessmentScoreRecordsPage />} />
            <Route
              path="self-assessment-forms/score-records"
              element={<Navigate to="/manager/self-assessment-forms/history" replace />}
            />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="reports" element={<ManagerReportsPage />} />
            <Route path="reports/kpi" element={<ManagerKpiReportsPage />} />
            <Route path="reports/feedback" element={<FeedbackReportPage mode="manager" />} />
            <Route path="reports/appraisal" element={<AppraisalReportsPage mode="manager" />} />
            <Route path="reports/self-assessment" element={<SelfAssessmentReportPage mode="manager" />} />
            <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
          </Route>
        </Route>

        {/* Employee Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['EMPLOYEE']} />}>
          <Route path="/employee" element={<EmployeeLayout />}>
            <Route path="dashboard" element={<EmployeeDashboardPage />} />
            <Route path="kpis" element={<MyKpisPage />} />
            <Route path="pip" element={<PipMonitoringPage />} />
            <Route path="pip/:id" element={<PipDetailPage />} />
            <Route path="360-feedback/give" element={<GiveFeedbackPage />} />
            <Route path="360-feedback/received" element={<GetFeedbackPage />} />
            <Route path="360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
            <Route path="360-feedback/combined-history" element={<Navigate to="/employee/360-feedback/history" replace />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="settings/profile" element={<Navigate to="/employee/profile" replace />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="self-assessment-forms" element={<EmployeeSelfAssessmentHubPage />} />
            <Route path="self-assessment-forms/my-form" element={<MySelfAssessmentFormPage />} />
            <Route path="self-assessment-forms/history" element={<SelfAssessmentScoreRecordsPage />} />
            <Route path="self-assessment-forms/reviews/:formId" element={<SelfAssessmentFormReviewPage />} />
            <Route path="meetings" element={<EmployeeMeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="notifications" element={<NotificationPage />} />
            <Route path="appraisals" element={<EmployeeAppraisalsPage />} />
            <Route path="appraisals/history" element={<AppraisalHistoryPage mode="employee" />} />
            <Route path="appraisals/:id/view" element={<EmployeeAppraisalViewPage />} />
            <Route path="reports" element={<EmployeeReportsPage />} />
            <Route path="reports/feedback" element={<FeedbackReportPage mode="employee" />} />
            <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
          </Route>
        </Route>

        {/* Audit Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['AUDIT']} />}>
          <Route path="/audit" element={<AuditLayout />}>
            <Route index element={<Navigate to="/audit/dashboard" replace />} />
            <Route path="dashboard" element={<AuditDashboard />} />
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="departments" element={<DepartmentListPage />} />
            <Route path="departments/:departmentId/employees" element={<DepartmentEmployeeListPage />} />
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
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
            <Route path="self-assessment/reviews/:formId" element={<SelfAssessmentFormReviewPage readOnly />} />
            <Route path="meetings" element={<MeetingsPage />} />
            <Route path="meetings/:id" element={<MeetingDetailPage />} />
            <Route path="360-feedback/history" element={<CombinedFeedbackHistoryPage />} />
            <Route path="reports" element={<HrReportsPage />} />
            <Route path="reports/feedback" element={<FeedbackReportPage mode="audit" />} />
            <Route path="reports/appraisal" element={<AppraisalReportsPage />} />
            <Route path="reports/self-assessment" element={<SelfAssessmentReportPage mode="audit" />} />
            <Route path="kpi-reports" element={<KpiReportsPage />} />
            <Route path="performance-reports" element={<PerformanceReportPage basePath="/audit/performance-reports" readOnly />} />
            <Route path="performance-reports/:employeeId" element={<PerformanceReportDetailPage basePath="/audit/performance-reports" readOnly />} />
            <Route path="logs" element={<AuditLogsPage />} />
            <Route path="activity-monitor" element={<AuditActivityPage />} />
            <Route path="security-analytics" element={<SecurityAnalytics />} />
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
