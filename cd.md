# Coding Agent Prompt: Add Manager Dropdown to Department Form

## Context
The Employee Performance Management System needs to display a manager dropdown when creating or editing departments. The dropdown should show all employees with role_id=2 (Department Manager role).

## SQL Queries to Use

### Query 1: Get All Managers
```sql
SELECT
    e.employee_id,
    e.full_name,
    e.staff_no,
    e.email,
    e.phone_number,
    e.department_id,
    d.department_name,
    d.department_code,
    p.position_name,
    p.position_code,
    u.user_id,
    r.role_name
FROM employee e
INNER JOIN user_account u ON e.employee_id = u.employee_id
INNER JOIN role r ON u.role_id = r.id
LEFT JOIN department d ON e.department_id = d.department_id
LEFT JOIN position p ON e.position_id = p.position_id
WHERE u.role_id = 2
    AND e.employment_status = 'ACTIVE';
```

### Query 2: Get Current Department Head
```sql
SELECT
    m.employee_id AS manager_id,
    m.full_name AS manager_name,
    m.staff_no AS manager_staff_no,
    d.department_id,
    d.department_name,
    e.employee_id,
    e.full_name AS employee_name,
    e.staff_no AS employee_staff_no,
    e.email AS employee_email,
    p.position_name,
    e.employment_status
FROM employee m
INNER JOIN user_account u ON m.employee_id = u.employee_id
INNER JOIN department d ON m.department_id = d.department_id
LEFT JOIN employee e ON e.manager_id = m.employee_id
LEFT JOIN position p ON e.position_id = p.position_id
WHERE u.role_id = 2
    AND m.employment_status = 'ACTIVE'
ORDER BY m.employee_id, e.employee_id;
```

## Design Decisions
- Manager = Employee with role_id=2 (Department Manager)
- Dropdown shows all managers from ANY department (not filtered)
- No new manager_id column added to Department entity
- Department head is derived from Employee.manager relationship

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Headless UI Combobox
- **Backend**: Spring Boot 4, Java 17, Spring Data JPA

## Backend Files to Create/Modify

### 1. Create ManagerOptionDto.java
**Path**: `backend/src/main/java/com/epms/backend/dto/department/ManagerOptionDto.java`
- Fields: employeeId, fullName, staffNo, email, phoneNumber, departmentId, departmentName, departmentCode, positionName, positionCode, userId, roleName

### 2. Modify DepartmentService.java
**Path**: `backend/src/main/java/com/epms/backend/service/DepartmentService.java`
- Add method: `List<ManagerOptionDto> getManagerOptions();`

### 3. Modify DepartmentServiceImpl.java
**Path**: `backend/src/main/java/com/epms/backend/service/DepartmentServiceImpl.java`
- Implement `getManagerOptions()` using Query 1 above
- Use EntityManager or native query

### 4. Modify DepartmentRestController.java
**Path**: `backend/src/main/java/com/epms/backend/controller/DepartmentRestController.java`
- Add endpoint: `GET /api/departments/managers/options`
- Returns: `ResponseEntity<List<ManagerOptionDto>>`

## Frontend Files to Create/Modify

### 1. Modify types.ts
**Path**: `frontend/src/features/department/types.ts`
- Add `ManagerOption` interface with fields matching ManagerOptionDto

### 2. Modify departmentApi.ts
**Path**: `frontend/src/features/department/api/departmentApi.ts`
- Add `getManagerOptions` endpoint query using RTK Query
- Endpoint: `GET /api/departments/managers/options`

### 3. Create ManagerAutocomplete.tsx
**Path**: `frontend/src/features/department/components/ManagerAutocomplete.tsx`
- Use `@headlessui/react` Combobox (same pattern as DepartmentAutocomplete.tsx)
- Props: managers, value, onChange, disabled, error, placeholder
- Display: fullName (staffNo) format

### 4. Modify AddDepartmentModal.tsx
**Path**: `frontend/src/features/department/components/AddDepartmentModal.tsx`
- Import and add ManagerAutocomplete component
- Add manager selection state
- Include manager_id in create request payload

### 5. Modify EditDepartmentModal.tsx
**Path**: `frontend/src/features/department/components/EditDepartmentModal.tsx`
- Import and add ManagerAutocomplete component
- Populate current department head on modal open (from Query 2)
- Update manager assignment on save

## Existing Patterns to Follow

### Dropdown Pattern (Headless UI)
```tsx
import { Combobox } from '@headlessui/react';

<Combobox value={selected} onChange={handleChange} nullable>
  <div className="relative">
    <Combobox.Input
      className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm..."
      displayValue={(item: ManagerOption) => item ? `${item.fullName} (${item.staffNo})` : ''}
      onChange={(event) => setQuery(event.target.value)}
    />
    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2" />
    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5...">
      {filteredManagers.map((manager) => (
        <Combobox.Option
          key={manager.employeeId}
          value={manager}
          className={({ active }) =>
            `relative cursor-default select-none py-2 pl-3 pr-9 ${
              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
            }`
          }
        >
          {({ selected, active }) => (
            <>
              <span className="block truncate">{manager.fullName} ({manager.staffNo})</span>
              <span className="block truncate text-xs text-gray-500">{manager.departmentName}</span>
            </>
          )}
        </Combobox.Option>
      ))}
    </Combobox.Options>
  </div>
</Combobox>
```

### Existing Dropdown References
- `frontend/src/pages/hr/create-account/DepartmentAutocomplete.tsx`
- `frontend/src/pages/hr/create-account/PositionAutocomplete.tsx`

## Verification Steps
1. Run application and navigate to HR > Departments
2. Click "Add Department" - verify manager dropdown appears with all active managers
3. Select a manager and save - verify department is created
4. Click "Edit" on a department - verify current manager is pre-selected
5. Change manager and save - verify update persists
6. Check API returns correct manager data via Swagger UI at `/swagger-ui.html`

## Notes
- Department head is derived, not stored - no database schema change needed
- Manager dropdown should be nullable (department may not have a head yet)
- Use employment_status = 'ACTIVE' filter for both queries
