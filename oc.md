# Add Manager Dropdown to Department Create/Edit

## Context

The employee performance management system needs to associate a manager (Department Head) with each department. When creating or editing a department, an HR user should be able to select a manager from a dropdown of all active managers (users with role_id=2).

## Database Changes

Run the following SQL to add `manager_id` column to the `department` table:

```sql
ALTER TABLE department ADD COLUMN manager_id BIGINT REFERENCES employee(employee_id);
```

## Backend Implementation

### 1. `Department.java` (Entity)
**Path:** `backend/src/main/java/com/epms/backend/entity/Department.java`

Add `managerId` field:
```java
@Column(name = "manager_id")
private Long managerId;
```

### 2. `ManagerOptionDto.java` (NEW DTO)
**Path:** `backend/src/main/java/com/epms/backend/dto/department/ManagerOptionDto.java`

```java
package com.epms.backend.dto.department;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerOptionDto {
    private Long employeeId;
    private String fullName;
    private String staffNo;
    private String departmentName;
    private String positionName;
}
```

### 3. `CreateDepartmentRequest.java`
**Path:** `backend/src/main/java/com/epms/backend/dto/department/CreateDepartmentRequest.java`

Add `managerId` field (required - every department must have a manager):
```java
@NotNull(message = "Manager is required.")
private Long managerId;
```

### 4. `UpdateDepartmentRequest.java`
**Path:** `backend/src/main/java/com/epms/backend/dto/department/UpdateDepartmentRequest.java`

Add `managerId` field (required):
```java
@NotNull(message = "Manager is required.")
private Long managerId;
```

### 5. `DepartmentDto.java`
**Path:** `backend/src/main/java/com/epms/backend/dto/department/DepartmentDto.java`

Add `managerId` and `managerName` fields:
```java
private Long managerId;
private String managerName;
```

### 6. `DepartmentService.java` (Interface)
**Path:** `backend/src/main/java/com/epms/backend/service/DepartmentService.java`

Add method:
```java
List<ManagerOptionDto> getAllManagers();
```

### 7. `DepartmentServiceImpl.java`
**Path:** `backend/src/main/java/com/epms/backend/service/DepartmentServiceImpl.java`

**a)** Inject `JdbcTemplate` (already present) - no change needed.

**b)** Update `createDepartment()` - set manager:
```java
department.setManagerId(request.getManagerId());
```

**c)** Update `updateDepartment()` - set manager:
```java
department.setManagerId(request.getManagerId());
```

**d)** Update `mapToDto()` - include manager info:
```java
// Need to query or fetch manager name from employee
// Use JdbcTemplate to query manager name by managerId
private String getManagerName(Long managerId) {
    if (managerId == null) return null;
    String sql = "SELECT full_name FROM employee WHERE employee_id = ?";
    try {
        return jdbcTemplate.queryForObject(sql, String.class, managerId);
    } catch (Exception e) {
        return null;
    }
}
```

**e)** Implement `getAllManagers()`:
```java
@Override
public List<ManagerOptionDto> getAllManagers() {
    String sql = """
        SELECT
            e.employee_id,
            e.full_name,
            e.staff_no,
            COALESCE(d.department_name, '') AS department_name,
            COALESCE(p.position_name, '') AS position_name
        FROM employee e
        INNER JOIN user_account u ON e.employee_id = u.employee_id
        LEFT JOIN department d ON e.department_id = d.department_id
        LEFT JOIN position p ON e.position_id = p.position_id
        WHERE u.role_id = 2
            AND e.employment_status = 'ACTIVE'
        ORDER BY e.full_name ASC
        """;
    return jdbcTemplate.query(sql, (rs, rowNum) -> ManagerOptionDto.builder()
            .employeeId(rs.getLong("employee_id"))
            .fullName(rs.getString("full_name"))
            .staffNo(rs.getString("staff_no"))
            .departmentName(rs.getString("department_name"))
            .positionName(rs.getString("position_name"))
            .build());
}
```

**f)** Update `getAllDepartments()` query to include `manager_id` and join for `manager_name`.

### 8. `DepartmentRestController.java`
**Path:** `backend/src/main/java/com/epms/backend/controller/DepartmentRestController.java`

Add endpoint:
```java
@GetMapping("/managers")
@PreAuthorize("hasRole('HR')")
public ResponseEntity<ApiResponse<List<ManagerOptionDto>>> getAllManagers() {
    return ResponseEntity.ok(ApiResponse.ok("Managers fetched successfully.", departmentService.getAllManagers()));
}
```

---

## Frontend Implementation

### 1. `types.ts`
**Path:** `frontend/src/features/department/types.ts`

Add `ManagerOption` interface and update existing interfaces:
```typescript
export interface ManagerOption {
  employeeId: number
  fullName: string
  staffNo: string
  departmentName: string
  positionName: string
}

export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number
  managerName: string
  createdDate: string
  updatedDate: string
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  managerId: number
  status?: 'Active' | 'Inactive'
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number
}
```

### 2. `departmentApi.ts`
**Path:** `frontend/src/features/department/api/departmentApi.ts`

Add `getManagers` query endpoint:
```typescript
getManagers: builder.query<ApiResponse<ManagerOption[]>, void>({
  query: () => '/departments/managers',
  providesTags: ['Manager'],
}),
```

Export:
```typescript
export const {
  useGetDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetManagersQuery,
} = departmentApi
```

### 3. `AddDepartmentModal.tsx`
**Path:** `frontend/src/features/department/components/AddDepartmentModal.tsx`

**Changes:**
- Import `useGetManagersQuery` from departmentApi
- Import `User` icon from lucide-react (for manager field)
- Update zod schema to include `managerId`:
```typescript
const departmentSchema = z.object({
  departmentCode: z.string().trim().min(1, 'Department code is required.'),
  departmentName: z.string().trim().min(1, 'Department name is required.'),
  managerId: z.number().min(1, 'Manager is required.'),
})
```
- Fetch managers on mount:
```typescript
const { data: managersData } = useGetManagersQuery()
const managers = managersData?.data ?? []
```
- Add manager dropdown field after Department Name field:
```tsx
<div>
  <label htmlFor="add-dept-manager" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
    <User size={11} className="text-slate-400" />
    Manager <span className="text-red-500">*</span>
  </label>
  <select
    id="add-dept-manager"
    {...register('managerId', { valueAsNumber: true })}
    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
      focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer
      ${errors.managerId
        ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100 text-red-900'
        : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:ring-blue-100 text-slate-800'
      }`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 14px center',
    }}
  >
    <option value="">Select Manager</option>
    {managers.map((m) => (
      <option key={m.employeeId} value={m.employeeId}>
        {m.fullName} ({m.staffNo}) - {m.departmentName} - {m.positionName}
      </option>
    ))}
  </select>
  {errors.managerId && (
    <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
      <AlertCircle size={12} />
      {errors.managerId.message}
    </p>
  )}
</div>
```

### 4. `EditDepartmentModal.tsx`
**Path:** `frontend/src/features/department/components/EditDepartmentModal.tsx`

**Changes:**
- Import `useGetManagersQuery` from departmentApi
- Import `User` icon from lucide-react
- Update zod schema:
```typescript
const departmentSchema = z.object({
  departmentCode: z.string().trim().min(1, 'Department code is required.'),
  departmentName: z.string().trim().min(1, 'Department name is required.'),
  status: z.enum(['Active', 'Inactive']),
  managerId: z.number().min(1, 'Manager is required.'),
})
```
- Fetch managers on mount:
```typescript
const { data: managersData } = useGetManagersQuery()
const managers = managersData?.data ?? []
```
- Update `useEffect` to reset form with `managerId`:
```typescript
useEffect(() => {
  if (department) {
    reset({
      departmentCode: department.departmentCode,
      departmentName: department.departmentName,
      status: normalizeFormStatus(department.status),
      managerId: department.managerId,
    })
  }
}, [department, reset])
```
- Add manager dropdown field (same style as AddDepartmentModal, using amber color scheme to match Edit modal's theme):
```tsx
<div>
  <label htmlFor="edit-dept-manager" className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
    <User size={11} className="text-slate-400" />
    Manager <span className="text-red-500">*</span>
  </label>
  <select
    id="edit-dept-manager"
    {...register('managerId', { valueAsNumber: true })}
    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none
      focus:ring-2 focus:ring-offset-0 appearance-none cursor-pointer
      ${errors.managerId
        ? 'border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100 text-red-900'
        : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-amber-100 text-slate-800'
      }`}
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 14px center',
    }}
  >
    <option value="">Select Manager</option>
    {managers.map((m) => (
      <option key={m.employeeId} value={m.employeeId}>
        {m.fullName} ({m.staffNo}) - {m.departmentName} - {m.positionName}
      </option>
    ))}
  </select>
  {errors.managerId && (
    <p className="mt-2 text-xs text-red-600 font-medium flex items-center gap-1.5">
      <AlertCircle size={12} />
      {errors.managerId.message}
    </p>
  )}
</div>
```

---

## Verification

After implementation:
1. Run lint/typecheck for both backend and frontend
2. Test the flow: HR creates a new department and selects a manager from dropdown
3. Test the flow: HR edits an existing department and changes the manager
4. Verify the department list/detail shows the correct manager name

## Notes

- Manager dropdown should show: `Full Name (Staff No) - Department Name - Position Name`
- The manager dropdown is required - form cannot be submitted without selecting a manager
- Role ID 2 corresponds to "Department Head/Manager" role (as per user confirmation)
