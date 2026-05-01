// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

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

// Dashboard Pages - Using the correct file names from your project
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { ManagerKpisPage } from './pages/manager/ManagerKpisPage';
import { MyKpisPage } from './pages/employee/MyKpisPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';
import { CreateEmployeeAccountPage } from './pages/hr/CreateEmployeeAccountPage';
import EmployeeListPage from './pages/hr/employees/EmployeeListPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { DefaultSignaturePage } from './pages/DefaultSignaturePage';

// Performance Modules
import PipMonitoringPage from './pages/PipMonitoringPage';
import PipCreatePage from './pages/PipCreatePage';
import PipDetailPage from './pages/PipDetailPage';
import { CriteriaPage } from './pages/hr/CriteriaPage';
import { AppraisalsPage } from './pages/hr/AppraisalsPage';
import { GiveFeedbackPage } from './pages/GiveFeedbackPage';
import { FeedbackHistoryPage } from './pages/FeedbackHistoryPage';
import { GetFeedbackPage } from './pages/GetFeedbackPage';
import { KpiManagementPage } from './pages/hr/KpiManagementPage';
import { KpiAssignedPage } from './pages/hr/KpiAssignedPage';
import { KpiDetailPage } from './pages/hr/KpiDetailPage';
import { KpiCategoryPage } from './pages/hr/KpiCategoryPage';
import { KpiHistoryPage } from './pages/hr/KpiHistoryPage';
import { AppraisalSubmissionsPage } from './pages/hr/AppraisalSubmissionsPage';
import DepartmentDetailPage from './pages/hr/departments/DepartmentDetailPage';
import DepartmentListPage from './pages/hr/departments/DepartmentListPage';
import PositionListPage from './features/position/pages/PositionListPage';
import LevelCodeListPage from './features/levelCode/pages/LevelCodeListPage';

// Self Assessment (HR templates & employee flows)
import { SelfAssessmentFormTemplatePage } from './pages/self-assessment-form/SelfAssessmentFormTemplatePage';
import { CreateSelfAssessmentTemplatePage } from './pages/self-assessment-form/CreateSelfAssessmentTemplatePage';
import { MySelfAssessmentFormPage } from './pages/self-assessment-form/MySelfAssessmentFormPage';
import { SelfAssessmentFormReviewPage } from './pages/self-assessment-form/SelfAssessmentFormReviewPage';
import { SelfAssessmentActiveFormsPage } from './pages/self-assessment-form/SelfAssessmentActiveFormsPage';
import { QuestionBankPage } from './pages/self-assessment-form/QuestionBankPage';

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
            <Route path="departments/:departmentId" element={<DepartmentDetailPage />} />
            <Route path="positions" element={<PositionListPage />} />
            <Route path="level-codes" element={<LevelCodeListPage />} />

            <Route path="pip-monitoring" element={<PipMonitoringPage />} />
            <Route path="pip-monitoring/:id" element={<PipDetailPage />} />
            <Route path="360-feedback/criteria" element={<CriteriaPage />} />
            <Route path="360-feedback/give" element={<GiveFeedbackPage />} />
            <Route path="360-feedback/received" element={<GetFeedbackPage />} />
            <Route path="360-feedback/history" element={<FeedbackHistoryPage />} />
            <Route path="appraisals" element={<AppraisalsPage />} />
            <Route path="appraisals/submissions" element={<AppraisalSubmissionsPage />} />
            <Route path="kpi-management" element={<KpiManagementPage />} />
            <Route path="kpi-assigned" element={<KpiAssignedPage />} />
            <Route path="kpi-detail" element={<KpiDetailPage />} />
            <Route path="kpi-categories" element={<KpiCategoryPage />} />
            <Route path="kpi-history" element={<KpiHistoryPage />} />
            <Route path='AppraisalSubmissionsPage' element={<AppraisalSubmissionsPage />} />
            <Route path="settings/profile" element={<ProfileSettingsPage />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="self-assessment/templates" element={<SelfAssessmentFormTemplatePage />} />
            <Route path="self-assessment/templates/create" element={<CreateSelfAssessmentTemplatePage />} />
            <Route path="self-assessment/forms" element={<SelfAssessmentActiveFormsPage />} />
            <Route
              path="self-assessment/forms/create"
              element={<Navigate to="/hr/self-assessment/templates/create" replace />}
            />
            <Route path="self-assessment/question-bank" element={<QuestionBankPage />} />
            <Route path="self-assessment/reviews" element={<SelfAssessmentFormReviewPage />} />
            <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
          </Route>
        </Route>

        {/* Manager Routes */}
        <Route element={<ProtectedRoute allowedRoleGroups={['MANAGER']} />}>
          <Route path="/manager" element={<ManagerLayout />}>
            <Route path="dashboard" element={<ManagerDashboardPage />} />
            <Route path="employees" element={<EmployeeListPage />} />
            <Route path="kpis" element={<ManagerKpisPage />} />
            <Route path="kpi-history" element={<KpiHistoryPage />} />
            <Route path="my-kpis" element={<MyKpisPage />} />
            <Route path="pip" element={<PipMonitoringPage />} />
            <Route path="pip/create" element={<PipCreatePage />} />
            <Route path="pip/:id" element={<PipDetailPage />} />
            <Route path="360-feedback/give" element={<GiveFeedbackPage />} />
            <Route path="360-feedback/received" element={<GetFeedbackPage />} />
            <Route path="360-feedback/history" element={<FeedbackHistoryPage />} />
            <Route path="settings/profile" element={<ProfileSettingsPage />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="self-assessment-forms/reviews" element={<SelfAssessmentFormReviewPage />} />
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
            <Route path="360-feedback/history" element={<FeedbackHistoryPage />} />
            <Route path="settings/profile" element={<ProfileSettingsPage />} />
            <Route path="settings/signature" element={<DefaultSignaturePage />} />
            <Route path="settings/system" element={<SystemSettingsPage />} />
            <Route path="self-assessment-forms/my-form" element={<MySelfAssessmentFormPage />} />
            <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
