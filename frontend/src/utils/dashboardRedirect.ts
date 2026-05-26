// frontend/src/utils/dashboardRedirect.ts

export interface User {
  id: number;
  employeeId: string | null;
  name: string;
  email: string;
  role: string;
  roleId: number;
  mustChangePassword?: boolean;
  profilePictureUrl?: string;
}

/**
 * Determines the dashboard path based on user's role
 * roleId: 1 = HR → HR Dashboard
 * roleId: 2 = Department Head → Manager Dashboard
 * roleId: 3 = Team Head → Manager Dashboard
 * roleId: 4 = Employee → Employee Dashboard
 * roleId: 5 = AUDIT → Auditor Dashboard
 */
export const getDashboardPath = (user: User): string => {
  const roleId = user.roleId;

  // HR role (roleId = 1)
  if (roleId === 1) {
    return '/hr/dashboard';
  }

  // Manager role
  if (roleId === 2) {
    return '/manager/dashboard';
  }

  // AUDIT role
  if (roleId === 5) {
    return '/audit/dashboard';
  }

  // Employee (3, 4) and others
  return '/employee/dashboard';
};

/**
 * Gets the role group for route protection
 */
export const getRoleGroup = (user: User): 'HR' | 'MANAGER' | 'EMPLOYEE' | 'AUDIT' => {
  if (user.roleId === 1) return 'HR';
  if (user.roleId === 2) return 'MANAGER';
  if (user.roleId === 5) return 'AUDIT';
  return 'EMPLOYEE';
};
