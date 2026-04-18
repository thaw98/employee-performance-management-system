// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { store } from './app/store';
import { AuthBootstrap } from './components/auth/AuthBootstrap';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { FirstLoginPasswordPage } from './pages/auth/FirstLoginPasswordPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Layouts
import HrLayout from './layouts/HrLayout';
import ManagerLayout from './layouts/ManagerLayout';
import EmployeeLayout from './layouts/EmployeeLayout';

// Dashboard Pages - Using the correct file names from your project
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { EmployeeDashboardPage } from './pages/employee/EmployeeDashboardPage';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthBootstrap />
        <Toaster position="top-right" />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/first-login/set-password" element={<FirstLoginPasswordPage />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* HR Routes */}
          <Route element={<ProtectedRoute allowedRoleGroups={['HR']} />}>
            <Route path="/hr" element={<HrLayout />}>
              <Route path="dashboard" element={<HRDashboardPage />} />
              <Route path="*" element={<Navigate to="/hr/dashboard" replace />} />
            </Route>
          </Route>

          {/* Manager Routes */}
          <Route element={<ProtectedRoute allowedRoleGroups={['MANAGER']} />}>
            <Route path="/manager" element={<ManagerLayout />}>
              <Route path="dashboard" element={<ManagerDashboardPage />} />
              <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
            </Route>
          </Route>

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoleGroups={['EMPLOYEE']} />}>
            <Route path="/employee" element={<EmployeeLayout />}>
              <Route path="dashboard" element={<EmployeeDashboardPage />} />
              <Route path="*" element={<Navigate to="/employee/dashboard" replace />} />
            </Route>
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;