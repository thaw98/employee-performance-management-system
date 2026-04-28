# Department Manager Feature - Implementation Task

## Objective
Add a `manager_id` field to the Department entity so that each department has one manager (Department Head with `role_id=2`). This field must be present in Create, Edit, and View Department operations.

---

## Database Schema (from 27apr3.sql)

### Current `department` Table
```sql
CREATE TABLE `department` (
  `department_id` bigint NOT NULL AUTO_INCREMENT,
  `department_code` varchar(20) DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `department_name` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive') NOT NULL,
  `updated_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`department_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### Current `employee` Table (relevant fields)
```sql
CREATE TABLE `employee` (
  `employee_id` bigint NOT NULL AUTO_INCREMENT,
  `full_name` varchar(50) NOT NULL,
  `manager_id` bigint DEFAULT NULL,  -- Self-referential FK to employee
  `position_id` bigint DEFAULT NULL,
  ...
  PRIMARY KEY (`employee_id`),
  KEY `FKou6wbxug1d0qf9mabut3xqblo` (`manager_id`),
  CONSTRAINT `FKou6wbxug1d0qf9mabut3xqblo` FOREIGN KEY (`manager_id`) REFERENCES `employee` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### Current `position` Table (relevant fields)
```sql
CREATE TABLE `position` (
  `position_id` bigint NOT NULL AUTO_INCREMENT,
  `position_code` varchar(20) DEFAULT NULL,
  `position_name` varchar(100) DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,  -- FK to role table
  ...
  PRIMARY KEY (`position_id`),
  CONSTRAINT `fk_position_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
```

### Current `role` Table (existing data)
```sql
INSERT INTO `role` VALUES
(1,'2026-04-18 17:04:14.000000','Human Resources - Full system access','ALL','HR'),
(2,'2026-04-18 17:04:14.000000','Department Head - Manage department employees','DEPARTMENT','Department Head'),
(3,'2026-04-18 17:04:14.000000','Team Head - Manage team members','TEAM','Team Head'),
(4,'2026-04-18 17:04:14.000000','Regular Employee - Self service only','SELF','Employee');
```
- `role_id=2` is **Department Head** (Manager)

---

## Required Changes

### 1. Database Migration
Add `manager_id` column to `department` table:
```sql
ALTER TABLE department ADD COLUMN manager_id BIGINT NULL;
```
- This is nullable (existing departments can be assigned later)
- Add FK constraint: `FOREIGN KEY (manager_id) REFERENCES employee(employee_id)`

### 2. Backend Entity
**File:** `backend/src/main/java/com/epms/backend/entity/Department.java`

Add field:
```java
@Column(name = "manager_id")
private Long managerId;

// Add @ManyToOne relationship
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "manager_id", insertable = false, updatable = false)
private Employee manager;
```

### 3. Backend DTOs

**File:** `backend/src/main/java/com/epms/backend/dto/department/DepartmentDto.java`

Add fields:
```java
private Long managerId;
private String managerName;  // Full name of the manager employee
```

**File:** `backend/src/main/java/com/epms/backend/dto/department/CreateDepartmentRequest.java`

Add field:
```java
private Long managerId;  // Required
```

**File:** `backend/src/main/java/com/epms/backend/dto/department/UpdateDepartmentRequest.java`

Add field:
```java
private Long managerId;  // Required
```

### 4. Backend Service
**File:** `backend/src/main/java/com/epms/backend/service/DepartmentServiceImpl.java`

Changes:
- `getAllDepartments()`: Update SQL query to JOIN with employee table to get manager info (manager_id, manager full_name as managerName)
- `createDepartment()`: Set `department.setManagerId(request.getManagerId())`
- `updateDepartment()`: Update manager_id if provided
- `mapToDto()`: Map managerId and managerName to DTO

### 5. Backend Repository
**File:** `backend/src/main/java/com/epms/backend/repository/DepartmentRepository.java`

Add query method to find manager name by employee id (if not already present):
```java
Optional<String> findManagerNameById(Long managerId);
```

### 6. Frontend Types
**File:** `frontend/src/features/department/types.ts`

Update interfaces:
```typescript
export interface DepartmentDto {
  departmentId: number
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  createdDate: string
  updatedDate: string
  managerId: number | null
  managerName: string | null
}

export interface CreateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status?: 'Active' | 'Inactive'
  managerId: number  // Required
}

export interface UpdateDepartmentRequest {
  departmentCode: string
  departmentName: string
  status: 'Active' | 'Inactive'
  managerId: number  // Required
}
```

### 7. Frontend API
**File:** `frontend/src/features/department/api/departmentApi.ts`

Update `normalizeDepartment` to include managerId and managerName.

### 8. Frontend Create Modal
**File:** `frontend/src/features/department/components/AddDepartmentModal.tsx`

Add:
- Fetch employees with role_id=2 (Department Head) for manager dropdown
- Add required manager dropdown field
- Include managerId in the API request body

### 9. Frontend Edit Modal
**File:** `frontend/src/features/department/components/EditDepartmentModal.tsx`

Add:
- Fetch employees with role_id=2 for manager dropdown
- Pre-select current manager in dropdown
- Include managerId in the API request body

### 10. Frontend Department Detail Page
**File:** `frontend/src/pages/hr/departments/DepartmentDetailPage.tsx`

Display manager information in the department header section (e.g., "Manager: John Smith").

---

## Key Constraints
- Manager must be an employee with `role_id=2` (Department Head role)
- Manager field is **required** for Create and Edit operations
- Existing departments can remain without a manager (nullable)
- Display manager name as `managerName` in views

---

## Employee API Endpoint for Manager Dropdown
Create or use existing endpoint to fetch employees with role_id=2:

If not existing, add endpoint in backend:
```java
@GetMapping("/managers/options")
@PreAuthorize("hasRole('HR')")
public ResponseEntity<ApiResponse<List<EmployeeOptionDto>>> listManagers() {
    // Return employees where position.role_id = 2
}
```

Frontend can use existing employee list endpoint and filter client-side, or create new endpoint for manager options.

---

## Files to Modify
1. `backend/src/main/java/com/epms/backend/entity/Department.java`
2. `backend/src/main/java/com/epms/backend/dto/department/DepartmentDto.java`
3. `backend/src/main/java/com/epms/backend/dto/department/CreateDepartmentRequest.java`
4. `backend/src/main/java/com/epms/backend/dto/department/UpdateDepartmentRequest.java`
5. `backend/src/main/java/com/epms/backend/service/DepartmentServiceImpl.java`
6. `backend/src/main/java/com/epms/backend/repository/DepartmentRepository.java`
7. `frontend/src/features/department/types.ts`
8. `frontend/src/features/department/api/departmentApi.ts`
9. `frontend/src/features/department/components/AddDepartmentModal.tsx`
10. `frontend/src/features/department/components/EditDepartmentModal.tsx`
11. `frontend/src/pages/hr/departments/DepartmentDetailPage.tsx`

---

## Verification
After implementation:
1. Create a new department with a manager selected - should save successfully
2. Edit a department to change/assign manager - should update successfully
3. View department detail page - should display manager name
4. Try to create/edit department without manager - should show validation error
